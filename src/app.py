"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


# In-memory calories database (calories per 100g)
ingredients = {
    "Chicken Breast": 165,
    "Brown Rice": 216,
    "White Rice": 206,
    "Broccoli": 34,
    "Egg": 155,
    "Whole Milk": 61,
    "Cheddar Cheese": 403,
    "White Bread": 265,
    "Whole Wheat Bread": 247,
    "Banana": 89,
    "Apple": 52,
    "Orange": 47,
    "Salmon": 208,
    "Tuna (canned)": 116,
    "Ground Beef (lean)": 215,
    "Pasta (cooked)": 158,
    "Potato": 77,
    "Sweet Potato": 86,
    "Spinach": 23,
    "Carrot": 41,
    "Tomato": 18,
    "Cucumber": 15,
    "Oats": 389,
    "Greek Yogurt": 59,
    "Butter": 717,
    "Olive Oil": 884,
    "Almonds": 579,
    "Peanut Butter": 588,
    "Lentils (cooked)": 116,
    "Black Beans (cooked)": 132,
}


class Ingredient(BaseModel):
    name: str
    calories_per_100g: int


class MealItem(BaseModel):
    ingredient: str
    grams: float


@app.get("/ingredients")
def get_ingredients():
    """Get all ingredients with their calories per 100g"""
    return ingredients


@app.post("/ingredients")
def add_ingredient(ingredient: Ingredient):
    """Add a new ingredient to the database"""
    if ingredient.calories_per_100g < 0:
        raise HTTPException(status_code=400, detail="Calories must be non-negative")
    ingredients[ingredient.name] = ingredient.calories_per_100g
    return {"message": f"Added {ingredient.name} with {ingredient.calories_per_100g} kcal per 100g"}


@app.post("/calories/calculate")
def calculate_calories(meal: list[MealItem]):
    """Calculate total calories for a list of ingredient/gram pairs"""
    total = 0.0
    breakdown = []
    for item in meal:
        if item.ingredient not in ingredients:
            raise HTTPException(status_code=404, detail=f"Ingredient '{item.ingredient}' not found")
        cals = ingredients[item.ingredient] * item.grams / 100
        breakdown.append({"ingredient": item.ingredient, "grams": item.grams, "calories": round(cals, 1)})
        total += cals
    return {"total_calories": round(total, 1), "breakdown": breakdown}
