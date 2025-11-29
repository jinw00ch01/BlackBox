1. Prerequisites

✔ Python 3.10 이상

https://www.python.org/downloads/

✔ pip (Python 기본 포함)

설치 확인:

python --version
pip --version

2. Clone Repository
git clone <repo-url>
cd backend

3. Virtual Environment Setup
Windows
python -m venv venv
venv\Scripts\activate

macOS / Linux
python -m venv venv
source venv/bin/activate

4. Install Dependencies
pip install -r requirements.txt


이 명령은 FastAPI, Bedrock SDK(boto3), dotenv 등 백엔드 서버 실행에 필요한 패키지를 자동 설치한다.

5. Environment Variables

파일 생성:

backend/.env


내용:

AWS_ACCESS_KEY=xxx
AWS_SECRET_KEY=xxx
AWS_REGION=us-east-1
KB_ID=xxxx


자기꺼입력

6. Run Backend Server
uvicorn main2:app --reload


서버 실행 후 확인:

http://localhost:8000


프론트엔드는 /chat API로 통신한다.

7. API Endpoint
POST /chat

LLM 응답 + Knowledge Base 검색 결과 반환.

Body Example

{
  "message": "우회전 규정 알려줘"
}


Response Example

{
  "answer": "모델 답변",
  "contexts": ["검색된 KB 문서 내용 1", "문서 2"]
}

8. Run Frontend (React + Vite)

1) Move into frontend folder
cd frontend

2) Install Node.js 18+
https://nodejs.org/

3) Install project dependencies
npm install

4) Start Vite dev server
npm run dev

5) Access the frontend
http://localhost:5173

Frontend communicates with backend through:
POST http://localhost:8000/chat