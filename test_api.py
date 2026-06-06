import requests
import json

url_opt = "http://127.0.0.1:8000/optimizer"
url_cl = "http://127.0.0.1:8000/cover-letter"

payload = {
    "resumeText": """John Doe
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
    "jobDescription": "We are looking for a Senior React Developer with experience in TypeScript, Docker, PostgreSQL, AWS, and Next.js. Must have strong leadership skills."
}

print("Testing /optimizer endpoint...")
try:
    r = requests.post(url_opt, json=payload, timeout=60)
    print(f"Status code: {r.status_code}")
    print("Response JSON:")
    print(json.dumps(r.json(), indent=2))
except Exception as e:
    print(f"Error testing /optimizer: {e}")

print("\nTesting /cover-letter endpoint...")
try:
    r = requests.post(url_cl, json=payload, timeout=60)
    print(f"Status code: {r.status_code}")
    print("Response JSON:")
    print(json.dumps(r.json(), indent=2))
except Exception as e:
    print(f"Error testing /cover-letter: {e}")
