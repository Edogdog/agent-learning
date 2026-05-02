from fastapi import APIRouter
from pydantic import BaseModel
from services.code_sandbox import CodeSandbox

router = APIRouter()


class CodeRunRequest(BaseModel):
    code: str
    stdin: str = ""


class CodeTestRequest(BaseModel):
    code: str
    test_cases: list = []


@router.post("/run")
def run_code(req: CodeRunRequest):
    if not req.code.strip():
        return {"success": False, "stdout": "", "stderr": "代码不能为空", "returncode": -1}
    # Security: block dangerous imports
    dangerous = ["os.system", "subprocess", "shutil.rmtree", "__import__('os')", "eval(", "exec("]
    for d in dangerous:
        if d in req.code:
            return {"success": False, "stdout": "", "stderr": f"安全限制：代码中不允许使用 {d.split('(')[0]}", "returncode": -1}
    return CodeSandbox.run(req.code, req.stdin)


@router.post("/test")
def run_tests(req: CodeTestRequest):
    return CodeSandbox.run_with_tests(req.code, req.test_cases)
