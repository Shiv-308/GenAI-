import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone'
import { PineconeStore } from '@langchain/pinecone'; 

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});


async function indexDocument() {
    // TODO: Implement document indexing logic
    //Loading PDF
    const PDF_PATH = './dsa.pdf';
    const pdfLoader = new PDFLoader(PDF_PATH);
    const rawDocs = await pdfLoader.load();
    console.log("PDF Loaded");

    //Text Splitting
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    console.log("Chunks Created");
    console.log("Total chunks:", chunkedDocs.length);

    const validDocs = chunkedDocs.filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);
    console.log(`Chunks Created: ${validDocs.length} valid chunks out of ${chunkedDocs.length}`);

    if (validDocs.length === 0) {
        throw new Error("No readable text found in the provided PDF.");
    }

    //Vector Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-embedding-2",
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,

    });
    console.log("Embeddings Created");  

    //Initialize Pinecone
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    console.log("Pinecone Initialized");

    const vectors = [];

for (let i = 0; i < validDocs.length; i++) {
    const values = await embeddings.embedQuery(validDocs[i].pageContent);

    vectors.push({
        id: `doc-${i}`,
        values: values,
        metadata: {
            text: validDocs[i].pageContent,
        },
    });

    console.log(`Embedded ${i + 1}/${validDocs.length}`);
}

await pineconeIndex.upsert(vectors);

console.log("Vector Storage Complete");

}


await indexDocument();