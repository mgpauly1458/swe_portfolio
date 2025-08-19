import json
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()
import base64

def encode_image(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")

# Load test data
data_path = Path("test_data.json")  # replace with your JSON path
with open(data_path, "r") as f:
    data = json.load(f)

employees = data["employees"]
tools_list = data["tools"]
schedule = data["schedule"]

# ----------------------------
# LLM Processing
# ----------------------------
client = OpenAI()

def map_job_to_tasks(
    job_description: str,
    image_paths: Optional[List[Path]],
    tools: List[Dict],
    number_of_available_employees: int
) -> Dict:
    """
    Uses the LLM (text + images) to map a job description to:
    - A 1-sentence job summary (or "NA" if impossible with given tools / staffing)
    - Recommended number of people (minimum sufficient)
    - Approximate hours required
    """

    tools_str = ", ".join([tool["name"] for tool in tools])

    system_prompt = f"""
You are an expert landscape project planner.
Combine the written job description and the provided images to decide:
1) Whether the job can be completed with the available tools: {tools_str}, and with the number of available employees: {number_of_available_employees}.
2) If possible, respond STRICTLY as JSON with fields:
   - "summary": a single-sentence summary of the job; include any key dimensions/visible details that justify your estimate.
   - "minimum_number_of_people": the minimum number of workers required.
   - "hours": the approximate number of labor hours required (numeric) for the minimum number of people.
   - "tools": a minimum set of tool names required to complete the job.
3) If the job cannot be completed with the given tools or available employees, respond only with:
   {{ "summary": "NA" }}
"""

    # Build multimodal input (Responses API expects typed parts)
    inputs = [
        {
            "role": "system",
            "content": [
                {"type": "input_text", "text": system_prompt}
            ],
        }
    ]

    user_content = [
        {"type": "input_text", "text": f"Job description: {job_description}"}
    ]

    if image_paths:
        for path in image_paths:
            user_content.append(
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{encode_image(path)}",
                }
            )

    inputs.append({"role": "user", "content": user_content})

    response = client.responses.create(
        model="gpt-4.1",  # multimodal-capable model
        input=inputs,
        temperature=0
    )

    # Extract model text
    raw_text = response.output_text.strip()

    # Parse JSON or fall back to NA
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        parsed = {"summary": "NA"}

    return parsed

# ----------------------------
# Run Example
# ----------------------------
if __name__ == "__main__":
    # Example: simulate passing images
    # job_images = [Path("untrimmed_hedges.png")]  # replace with real file paths
    # job_description = "Trim these hedges. which are 5 feet tall and 4 feet wide, and 20 feet long."

    # job_images = [Path("large_dead_tree.png")]
    # job_description = "Remove a large dead tree that is 50 feet tall and 10 feet wide."

    job_description = "Mow the lawn of a standard high school football field, which is 100 yards long and 50 yards wide"
    job_images = []  # No images for this example
    
    number_of_available_employees = 5

    result = map_job_to_tasks(
        job_description, job_images, tools_list, number_of_available_employees
    )
    print("Result:", result)
