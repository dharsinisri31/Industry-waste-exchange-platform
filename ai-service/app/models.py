class MockModelQuery:
    def filter(self, *args, **kwargs):
        return self
    def all(self):
        return []
    def first(self):
        return None
    def count(self):
        return 0

class User:
    id = "1"
    email = "user@example.com"
    role = "industry_user"

class Industry:
    user_id = "1"
    company_name = "Eco Industry"
    industry_type = "Manufacturing"
    city = "Bangalore"
    contact_phone = "+91 9876543210"
    latitude = 12.9716
    longitude = 77.5946
    description = "Industrial facility"
    location = {"type": "Point", "coordinates": [77.5946, 12.9716]}

class Waste:
    id = "1"
    name = "Fly Ash"
    category = "Fly Ash"
    quantity = 100.0
    unit = "tons"
    price = 25.0
    city = "Bangalore"
    description = "Coal combustion byproduct"
    image_url = ""
    status = "available"
    uploader_id = "1"
    latitude = 12.9716
    longitude = 77.5946

class Transaction:
    id = "1"
    buyer_id = "1"
    seller_id = "2"
    status = "completed"

class Equipment:
    id = "1"
    title = "Hydraulic Press"
    status = "available"
