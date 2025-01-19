import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { HfInference } from '@huggingface/inference';
dotenv.config()


const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function generateEmbedding(text) {
    const response = await hf.featureExtraction({
      model: 'NeuML/pubmedbert-base-embeddings',
      inputs: text,
    });

    return response;
}

async function storeEmbedding(text, embedding) {
    const newDocument = {
        content: text,
        embedding
    }
    const response = await supabaseClient.from("documents").insert(newDocument);

    return response;
}

export async function generateAndStoreEmbedding(text) {
    const embedding = await generateEmbedding(text)
    return await storeEmbedding(text, embedding)
}


export async function findSimilarities(textQuery) {
    const embedding = await generateEmbedding(textQuery)
 
    return await supabaseClient.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: .4,
        match_count: 5
    })
}
