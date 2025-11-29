from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
import json

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
KB_ID = os.getenv("KB_ID")

bedrock_client = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

kb_client = boto3.client(
    "bedrock-agent-runtime",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatReq(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatReq):

    user_msg = req.message

    # --- KB 검색 ---
    kb_results = kb_client.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": user_msg},
        retrievalConfiguration={
            "vectorSearchConfiguration": {"numberOfResults": 3}
        }
    )

    contexts = [
        r["content"]["text"]
        for r in kb_results.get("retrievalResults", [])
        if "content" in r and "text" in r["content"]
    ]

    prompt = f"""
질문: {user_msg}
지식 기반 검색 결과: {contexts}
이를 참고해 자연스럽게 답변해줘.
"""

    # --- ★★★ nova 메시지 정식 형태 ★★★ ---
    payload = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "inferenceConfig": {
            "maxTokens": 1024
        }
    }

    # --- Bedrock 호출 ---
    response = bedrock_client.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        body=json.dumps(payload),
        accept="application/json",
        contentType="application/json"
    )

    output = json.loads(response["body"].read())

    # --- 답변 획득 ---
    answer = output["output"]["message"]["content"][0]["text"]

    return {
        "answer": answer,
        "contexts": contexts
    }

@app.get("/")
async def root():
    return {"msg": "Server OK"}
