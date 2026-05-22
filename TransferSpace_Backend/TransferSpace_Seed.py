import os
import requests
import time
from supabase import create_client
from googlesearch import search

# --- CONFIGURATION ---
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
SCORECARD_API_KEY = os.environ["SCORECARD_API_KEY"]


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"]


def find_cds_links():
    """
    Fetches schools from your DB and generates search links 
    to find Section D (Transfer) data.
    """
    # Fetch schools that are missing transfer GPA info
    response = (
        supabase.table("schools")
        .select("id, name")
        .is_("avg_gpa_transfer", "null")
        .limit(20) # Start with 20 at a time
        .execute()
    )
    
    schools = response.data
    print(f"--- Finding CDS links for {len(schools)} schools ---\n")

    for school in schools:
        name = school['name']
        query = f'"{name}" Common Data Set 2024 2025 filetype:pdf'
        
        print(f"SCHOOL: {name}")
        print(f"STEP 1: Open this search -> https://www.google.com/search?q={name.replace(' ', '+')}+Common+Data+Set+Section+D")
        
        # This tries to find the actual PDF link for you
        try:
            for j in search(query, num=1, stop=1, pause=2):
                print(f"PROBABLE PDF: {j}")
        except:
            print("Search limit reached. Use the Google link above.")
            
        print("-" * 30)

def update_manual_data(school_id, gpa, max_credits, residency):
    """
    Once you find the numbers in the PDF, use this function 
    to push them to Supabase.
    """
    data = {
        "avg_gpa_transfer": float(gpa),
        "max_credits_accepted": int(max_credits),
        "residency_credits_required": int(residency)
    }
    
    supabase.table("schools").update(data).eq("id", str(school_id)).execute()
    print(f"Updated ID {school_id} successfully.")

if __name__ == "__main__":
    # Run this to get your research links
    find_cds_links()
    
    # EXAMPLE USE (Uncomment below to actually update a school once you find data):
    # update_manual_data(school_id="100654", gpa=2.5, max_credits=60, residency=30)
    
    
def update_links_by_state(state_code):
    page = 0
    per_page = 100
    
    while True:
        # Added 'school.name' back to satisfy the NOT NULL constraint
        fields = "id,school.name,school.school_url"
        url = f"https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key={SCORECARD_API_KEY}&school.state={state_code}&fields={fields}&per_page={per_page}&page={page}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            results = response.json().get('results', [])
            
            if not results: break
                
            batch = []
            for school in results:
                raw_url = school.get('school.school_url')
                school_name = school.get('school.name')
                
                clean_url = None
                if raw_url:
                    clean_url = raw_url if raw_url.startswith('http') else f"https://{raw_url}"
                
                batch.append({
                    "id": str(school['id']),
                    "name": school_name, # Added this to fix the error
                    "transfer_info_link": clean_url,
                    "apply_link": f"{clean_url.rstrip('/')}/apply" if clean_url else None
                })
            
            # This will now succeed because 'name' is present
            supabase.table("schools").upsert(batch).execute()
            print(f"[{state_code}] Page {page} links updated.")
            
            page += 1
            time.sleep(0.1)
            
        except Exception as e:
            print(f"Error on {state_code}: {e}")
            break
        


if __name__ == "__main__":
    for state in STATES:
        update_links_by_state(state)