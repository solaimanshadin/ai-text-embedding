# AI Text Embedding with Supabase & Hugging Face 🌐

This repository provides an implementation for generating and storing text embeddings using the **PubMedBERT** model (`NeuML/pubmedbert-base-embeddings`) from Hugging Face and storing/querying the embeddings in a **Supabase** database with the **pg-vector** extension for efficient similarity searches.

## Features

- **Text Embedding Generation**: Generate embeddings using Hugging Face's `NeuML/pubmedbert-base-embeddings` model.
- **Embedding Storage**: Store embeddings alongside the original text in Supabase.
- **Similarity Search**: Perform similarity searches using Supabase's **pg-vector** extension.

## Prerequisites

- **Node.js** (v14 or higher)
- **Supabase Account**: [Sign up here](https://supabase.io/)
- **Hugging Face Account**: [Sign up here](https://huggingface.co/)
- **dotenv**: For managing environment variables

## Installation

1. Clone the repository and install dependencies:

    ```bash
    git clone https://github.com/solaimanshadin/ai-text-embedding.git
    cd ai-text-embedding
    npm install
    ```

2. Create a `.env` file in the root directory and add the following keys:

    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
    HUGGINGFACE_TOKEN=your_huggingface_api_token
    ```

3. Set up Supabase with the **pg-vector** extension for efficient vector operations:

    - Go to your Supabase dashboard.
    - Run the following SQL command to enable the `pg-vector` extension:

      ```sql
      create extension if not exists vector;
      ```

4. Ensure your Supabase database has a `documents` table with the following structure:

    | Column Name | Data Type | Notes                     |
    |-------------|-----------|---------------------------|
    | `id`        | integer   | Primary key, auto-increment |
    | `content`   | text      | Original text             |
    | `embedding` | vector    | Embedding array (using pg-vector) |

5. Add the `match_documents` function in your Supabase database for similarity matching:

    ```sql
    create or replace function match_documents(
        query_embedding vector,
        match_threshold float8,
        match_count int
    )
    returns table(id int, content text, similarity float8) as $$
    begin
        return query
        select
            id,
            content,
            1 - (embedding <=> query_embedding) as similarity
        from documents
        where 1 - (embedding <=> query_embedding) > match_threshold
        order by similarity desc
        limit match_count;
    end;
    $$ language plpgsql;
    ```

## Usage

### Import Functions

```javascript
import { generateAndStoreEmbedding, findSimilarities } from './path/to/your/script';
```

### Generate and Store Embedding

```javascript
const text = "Artificial intelligence is transforming the world!";
generateAndStoreEmbedding(text)
  .then(response => console.log('Embedding stored successfully!', response))
  .catch(err => console.error('Error generating embedding:', err));
```

### Find Similar Documents

```javascript
const query = "AI is revolutionizing industries.";
findSimilarities(query)
  .then(results => console.log('Found similar documents:', results))
  .catch(err => console.error('Error finding similarities:', err));
```

## Code Overview

### `generateEmbedding(text)`

Generates a text embedding using the Hugging Face `NeuML/pubmedbert-base-embeddings` model.

```javascript
async function generateEmbedding(text) {
  const response = await hf.featureExtraction({
    model: 'NeuML/pubmedbert-base-embeddings',
    inputs: text,
  });
  return response;
}
```

### `storeEmbedding(text, embedding)`

Stores the generated embedding in the `documents` table of your Supabase database.

```javascript
async function storeEmbedding(text, embedding) {
  const newDocument = {
    content: text,
    embedding,
  };
  const response = await supabaseClient.from("documents").insert(newDocument);
  return response;
}
```

### `findSimilarities(textQuery)`

Finds similar documents by comparing the embedding of `textQuery` with stored embeddings using a PostgreSQL RPC call with the **pg-vector** extension.

```javascript
async function findSimilarities(textQuery) {
  const embedding = await generateEmbedding(textQuery);
  return await supabaseClient.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.4,
    match_count: 5,
  });
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Hugging Face**: For the `NeuML/pubmedbert-base-embeddings` model.
- **Supabase**: For providing a scalable and open-source database solution with the **pg-vector** extension for vector similarity searches.
``