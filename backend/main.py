import requests
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI()

# This allows your Next.js frontend to talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# The "Database" of attack patterns
THREAT_SIGNATURES = {
    "SQL_INJECTION": [r"UNION\s+SELECT", r"OR\s+1=1", r"\'\s*--"],
    "XSS": [r"<script>", r"javascript:", r"onload="],
    "DIR_TRAVERSAL": [r"\.\./", r"/etc/passwd"]
}

@app.get("/")
def home():
    return {"message": "Security Engine is Running"}

import requests

@app.post("/scan")
async def scan_log(file: UploadFile = File(...)):
    content = await file.read()
    lines = content.decode("utf-8").splitlines()
    
    results = []
    unique_ips = set()
    
    # First pass: Find threats and collect unique IPs
    for line in lines:
        ip_match = re.search(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", line)
        ip_address = ip_match.group(1) if ip_match else "Unknown"

        for threat, patterns in THREAT_SIGNATURES.items():
            for pattern in patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    results.append({
                        "type": threat, 
                        "line": line[:100], 
                        "ip": ip_address
                    })
                    if ip_address != "Unknown":
                        unique_ips.add(ip_address)
                    break
    
    # Second pass: Get location for each unique IP
    ip_lookup = {}
    for ip in list(unique_ips)[:10]: # Limit to 10 for speed in MVP
        try:
            # We use a public API to get country names
            response = requests.get(f"http://ip-api.com/json/{ip}?fields=country").json()
            ip_lookup[ip] = response.get("country", "Unknown")
        except:
            ip_lookup[ip] = "Unknown"

    # Attach the country to each result
    for r in results:
        r["country"] = ip_lookup.get(r["ip"], "Unknown")
                    
    return {
        "total_lines": len(lines),
        "threats_found": len(results),
        "details": results
    }