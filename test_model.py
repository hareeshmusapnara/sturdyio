import sys
import os
import json

sys.path.append("python-api")
import main

print(f"Model Loaded: {main.MODEL_LOADED}")
if not main.MODEL_LOADED:
    print("Model failed to load, checking why...")

# Create mock requests
from main import OptimizerRequest, CoverLetterRequest

opt_req = OptimizerRequest(
    resumeText="""John Doe
Software Engineer
john@example.com | 123-456-7890 | linkedin.com/in/johndoe

SUMMARY
Experienced React Developer with 5 years of experience building web applications.

EXPERIENCE
Software Developer at Acme Corp (2021 - Present)
• Responsible for building front-end components.
• Worked on typescript optimization.
• Helped with team deployment using docker.
• Assisted with database migration to PostgreSQL.

EDUCATION
BS in Computer Science, State University (2017 - 2021)
""",
    jobDescription="We are looking for a Senior React Developer with experience in TypeScript, Docker, PostgreSQL, AWS, and Next.js. Must have strong leadership skills."
)

cl_req = CoverLetterRequest(
    resumeText=opt_req.resumeText,
    jobDescription=opt_req.jobDescription
)

print("\n--- Testing main.optimizer ---")
try:
    res = main.optimizer(opt_req)
    print("Result keys:", res.keys())
    print("Result optimizedResume length:", len(res.get("optimizedResume", "")))
    print("Result:")
    print(json.dumps(res, indent=2))
except Exception as e:
    print("Exception in optimizer:", e)

print("\n--- Testing main.cover_letter ---")
try:
    res = main.cover_letter(cl_req)
    print("Result:")
    print(json.dumps(res, indent=2))
except Exception as e:
    print("Exception in cover_letter:", e)
