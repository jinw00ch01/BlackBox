import os
import boto3
import json

# Lambda에서는 IAM 역할을 통해 자동으로 자격 증명이 제공됩니다
# AWS_REGION은 Lambda 환경에서 자동 설정됨 (또는 클라이언트가 자동 감지)
# 필요시 환경변수로 MY_AWS_REGION 등 다른 이름을 사용할 수 있음

KB_ID = os.environ.get("KB_ID")

# boto3 클라이언트 - 자격 증명 없이 생성 (IAM 역할 자동 사용)
bedrock_client = boto3.client("bedrock-runtime")
kb_client = boto3.client("bedrock-agent-runtime")


def lambda_handler(event, context):
    """
    Lambda 핸들러 함수
    API Gateway에서 호출됨
    """
    
    # CORS 헤더 (API Gateway에서도 설정 가능)
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
    }
    
    # OPTIONS 요청 처리 (CORS preflight)
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "")
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    # GET 요청 - 헬스체크
    if http_method == "GET":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"msg": "Server OK"})
        }
    
    # POST 요청 처리
    try:
        # body 파싱
        body = event.get("body", "{}")
        if isinstance(body, str):
            body = json.loads(body)
        
        user_msg = body.get("message", "")
        
        if not user_msg:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "message is required"})
            }
        
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
        
        # --- nova 메시지 형태 ---
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
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "answer": answer,
                "contexts": contexts
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }

