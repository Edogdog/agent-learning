import subprocess, tempfile, os, json

class CodeSandbox:
    TIMEOUT = 15  # seconds
    MAX_OUTPUT = 5000  # chars

    @staticmethod
    def run(code: str, stdin: str = "") -> dict:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
            f.write(code)
            tmp_path = f.name
        try:
            result = subprocess.run(
                ["python", tmp_path],
                capture_output=True, text=True, timeout=CodeSandbox.TIMEOUT,
                input=stdin, env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            )
            stdout = result.stdout[:CodeSandbox.MAX_OUTPUT]
            stderr = result.stderr[:CodeSandbox.MAX_OUTPUT]
            return {"success": result.returncode == 0, "stdout": stdout, "stderr": stderr, "returncode": result.returncode}
        except subprocess.TimeoutExpired:
            return {"success": False, "stdout": "", "stderr": "代码执行超时（超过15秒），请检查是否有死循环。", "returncode": -1}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": f"执行错误: {str(e)}", "returncode": -1}
        finally:
            try: os.unlink(tmp_path)
            except: pass

    @staticmethod
    def run_with_tests(code: str, test_cases: list) -> dict:
        test_runner = code + "\n\nimport json\nresults = []\n"
        for i, tc in enumerate(test_cases):
            test_runner += f"\n# Test case {i+1}\ntry:\n"
            test_runner += f"    result = {tc.get('call', 'None')}\n"
            test_runner += f"    expected = {json.dumps(tc.get('expected', None))}\n"
            test_runner += f"    results.append({{'case': {i+1}, 'passed': result == expected, 'got': str(result), 'expected': str(expected)}})\n"
            test_runner += "except Exception as e:\n    results.append({'case': " + str(i+1) + ", 'passed': False, 'got': str(e), 'expected': '" + str(tc.get('expected', '')) + "'})\n"
        test_runner += "print(json.dumps(results, ensure_ascii=False))\n"
        return CodeSandbox.run(test_runner)
