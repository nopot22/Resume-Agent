import pdfplumber
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


load_dotenv()
api_key = os.environ.get("GENAI_API_KEY")
client = genai.Client(api_key = api_key)


def get_text_from_pdf(filename):
    '''This function converts the given PDF file into text'''
    return_string = ''
    with pdfplumber.open(filename) as pdf:
            for page in pdf.pages:
                return_string += page.extract_text()
    return return_string


def send_to_llm(job_file, resume_file, prompt = 'Summarize this resume and see if the candidate is a good fit for the role.'):
    '''This function calls the pdf text extraction function and then calls the LLM and returns the response.'''
    extracted_job_text = get_text_from_pdf(job_file)
    extracted_resume_text = get_text_from_pdf(resume_file)
    #Process the pdfs into text to easily send to the LLM

    system_prompt = f'''
        You are a helpful resume summarization agent. 

        You will be given a job description as part of the system prompt and then compare it
        against the given resume in the users first regular prompt. Your job is summarize the
        applicants abilities according to their resume, and respond with this summary. You are 
        not to give any suggestions in the response only the summary of the resume. 

        Here is the job description: {extracted_job_text}
     '''

    prompt += f'''Here is the candidates resume: {extracted_resume_text}'''
    #add the resume to the user prompt

    messages = [
        types.Content(role='user', parts=[types.Part(text=prompt)]),
    ]

    config=types.GenerateContentConfig( #Set the system prompt for the LLM
        system_instruction=system_prompt
            )
    
    try: #call the LLM with specified model, contents, and config settings
        response = client.models.generate_content(
                model ='gemini-2.0-flash-001', 
                contents = messages, 
                config = config
            )
    except Exception as e:
        print(e)
        return
    
    #if the response is malformed or something else is wrong
    if response is None or response.usage_metadata is None:
        print('response is malformed')
        return
    
    return response


@app.route("/upload", methods=["POST"])
def upload():
    # -------------------------------
    # 1. Get files & prompt from form
    # -------------------------------
    job_file = request.files.get("job_file")
    resume_file = request.files.get("resume_file")
    prompt = request.form.get("prompt")

    print("Frontend request received:", prompt)
    print("Files:", job_file.filename, resume_file.filename)

    if not job_file or not resume_file:
        return jsonify({"error": "Missing files"}), 400
    
    #Send job description, resume, and prompt to the function that calls the LLM
    response = send_to_llm(job_file, resume_file, prompt)

    #if something went wrong with the LLM or malformed response
    if response is None:
        return jsonify({
            'message':"Something went wrong, please try again",
        }), 500
    
    # ------------------------------------
    # 3. Return a response
    # ------------------------------------
    return jsonify({
        "message": "Upload successful",
        "llm_output": response.text,
    }), 200


def main():
    
    verbose_flag = False

    #file_path = "C:\\Users\\User\\Documents\\Resumes\\Resume-NoahPotter.pdf"
    #extracted_text = get_text_from_pdf(file_path)
    #print(extracted_text)

    #job_description_path = "C:\Users\User\Documents\Projects\ResumeAgent\Nuvia-Job-Description.pdf"
    #job_text = get_text_from_pdf(job_description_path)

    #system_prompt = f
    '''
        You are a helpful resume summarization agent. 

        You will be given a job description as part of the system prompt and then compare it
        against the given resume in the users first regular prompt. Your job is summarize the
        applicants abilities according to their resume, and respond with this summary. You are 
        not to give any suggestions in the response only the summary of the resume. 

        Here is the job description: {job_text}
     '''
    
    '''messages = [
        types.Content(role='user', parts=[types.Part(text=prompt)]),
    ]

    config=types.GenerateContentConfig(
        system_instruction=system_prompt
            )
    
    try:
        response = client.models.generate_content(
                model ='gemini-2.0-flash-001', 
                contents = messages, 
                config = config
            )
    except Exception as e:
        print(e)
        return'''
''
if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=True)