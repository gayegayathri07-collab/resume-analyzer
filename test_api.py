import requests

# URL of the Django backend
url = "http://127.0.0.1:8000/api/analyze/"

# Create a dummy file for testing
with open("test_resume.pdf", "w") as f:
    f.write("Dummy resume content")

# Send the request
try:
    with open("test_resume.pdf", "rb") as f:
        files = {'resume': ('test_resume.pdf', f, 'application/pdf')}
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
