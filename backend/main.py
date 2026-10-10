import os
import random
from typing import Literal

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Touchgrass AI", version="1.0.0", description="Open AI for real-world micro-adventures")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

class QuestRequest(BaseModel):
    category: str = "Surprise me"
    energy: str = "A little low"
    minutes: int = Field(default=15, ge=3, le=180)
    count: int = Field(default=3, ge=1, le=6)

class CustomQuest(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    minutes: int = Field(default=15, ge=1, le=180)

QUEST_POOL = [
    {"category":"MOVE YOUR BODY","title":"Take the scenic route","description":"Walk somewhere you usually commute to. Take one turn you’ve never taken before.","time":"15 min","xp":40,"icon":"footprints","color":"mint","tag":"easy"},
    {"category":"NOTICE MORE","title":"Find your tiny nature","description":"Find 3 things growing through concrete. Take a breath. Leave them be.","time":"10 min","xp":30,"icon":"leaf","color":"yellow","tag":"easy"},
    {"category":"MAKE A CONNECTION","title":"The no-phone hello","description":"Say a genuine hello to someone you see regularly but have never spoken to.","time":"5 min","xp":50,"icon":"sun","color":"pink","tag":"brave"},
    {"category":"MAKE SOMETHING","title":"Collect five colours","description":"Find five different colours around you and sketch them or write them down.","time":"12 min","xp":35,"icon":"compass","color":"lavender","tag":"easy"},
    {"category":"NOTICE MORE","title":"Listen to the outside","description":"Sit outdoors for five quiet minutes. Notice three sounds you usually miss.","time":"8 min","xp":30,"icon":"trees","color":"mint","tag":"slow"},
    {"category":"MOVE YOUR BODY","title":"A tiny detour","description":"Take a safe, unfamiliar route around your block. Let curiosity pick the turns.","time":"20 min","xp":45,"icon":"footprints","color":"yellow","tag":"explore"},
    {"category":"MAKE A CONNECTION","title":"Send a voice note","description":"Send someone you care about a short voice note instead of another text.","time":"5 min","xp":35,"icon":"sun","color":"pink","tag":"brave"},
    {"category":"MAKE SOMETHING","title":"Pocket-sized gratitude","description":"Write down one ordinary thing that made today a little better.","time":"5 min","xp":25,"icon":"leaf","color":"lavender","tag":"gentle"},
    {"category":"MOVE YOUR BODY","title":"Stretch under the sky","description":"Find a safe outdoor spot and do a few easy stretches while looking at the sky.","time":"7 min","xp":30,"icon":"footprints","color":"mint","tag":"gentle"},
    {"category":"NOTICE MORE","title":"Meet a tree","description":"Find a tree nearby. Look closely at its bark, leaves, and the life around it.","time":"10 min","xp":35,"icon":"trees","color":"yellow","tag":"slow"},
    {"category":"MAKE A CONNECTION","title":"Give a specific compliment","description":"Tell someone something specific you appreciate about them, if it feels welcome.","time":"3 min","xp":40,"icon":"sun","color":"pink","tag":"brave"},
    {"category":"MAKE SOMETHING","title":"Make a tiny field guide","description":"Notice three interesting things on your walk and give each a made-up name.","time":"15 min","xp":40,"icon":"compass","color":"lavender","tag":"curious"},
]

async def ollama_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            response = await client.get(f"{OLLAMA_URL.rstrip('/')}/api/tags")
            if response.is_success:
                models = response.json().get("models", [])
                return any(OLLAMA_MODEL.split(":")[0] in m.get("name", "") for m in models)
    except Exception:
        pass
    return False

@app.get("/api/health")
async def health():
    connected = await ollama_available()
    return {"status":"ok", "service":"touchgrass-ai", "ollama_available":connected, "model":OLLAMA_MODEL if connected else None, "fallback":"built-in open adventure library"}

@app.get("/api/quests")
async def list_quests():
    quests = random.sample(QUEST_POOL, 3)
    return {"quests":quests, "source":"offline"}

@app.post("/api/quests")
async def generate_quests(request: QuestRequest):
    if await ollama_available():
        prompt = (
            "Create exactly {count} practical, safe, offline-first micro-adventures that help a person spend less time on screens and more time in the real world. "
            "Category preference: {category}. Energy: {energy}. Time limit: {minutes} minutes. "
            "Return ONLY valid JSON as {{\"quests\":[{{\"category\":\"SHORT UPPERCASE CATEGORY\",\"title\":\"short title\",\"description\":\"one or two friendly sentences\",\"time\":\"N min\",\"xp\":30,\"icon\":\"leaf|sun|footprints|compass|trees\",\"color\":\"mint|yellow|pink|lavender\",\"tag\":\"easy|brave|slow\"}}]}}. "
            "Make each quest safe, inclusive, low-cost, achievable without a car, and never require sharing location, buying anything, or approaching strangers if uncomfortable. No phones needed to complete quests."
        ).format(count=request.count, category=request.category, energy=request.energy, minutes=request.minutes)
        try:
            async with httpx.AsyncClient(timeout=35) as client:
                response = await client.post(f"{OLLAMA_URL.rstrip('/')}/api/generate", json={"model":OLLAMA_MODEL,"prompt":prompt,"stream":False,"format":"json","options":{"temperature":0.8}})
                response.raise_for_status()
                output = response.json().get("response", "")
                import json
                parsed = json.loads(output)
                quests = parsed.get("quests", [])
                if quests:
                    cleaned = []
                    for q in quests[:request.count]:
                        cleaned.append({
                            "category":str(q.get("category", "A LITTLE ADVENTURE")).upper()[:40],
                            "title":str(q.get("title", "A tiny adventure"))[:80],
                            "description":str(q.get("description", "Step outside and notice something new."))[:220],
                            "time":str(q.get("time", f"{request.minutes} min"))[:15],
                            "xp":max(10, min(100, int(q.get("xp", 35)))),
                            "icon":q.get("icon") if q.get("icon") in ["leaf","sun","footprints","compass","trees"] else "leaf",
                            "color":q.get("color") if q.get("color") in ["mint","yellow","pink","lavender"] else "mint",
                            "tag":str(q.get("tag", "easy"))[:20],
                        })
                    return {"quests":cleaned,"source":"ollama"}
        except Exception:
            pass
    pool = QUEST_POOL[:]
    category = request.category.upper()
    if category not in ["SURPRISE ME", ""]:
        matched = [q for q in pool if category in q["category"]]
        if matched:
            pool = matched + [q for q in pool if q not in matched]
    random.shuffle(pool)
    quests = []
    for quest in pool:
        if len(quests) >= request.count:
            break
        if int(quest["time"].split()[0]) <= request.minutes + 5 or len(quests) < 1:
            quests.append(quest.copy())
    while len(quests) < request.count:
        quests.append(random.choice(QUEST_POOL).copy())
    return {"quests":quests,"source":"offline"}

@app.post("/api/custom-quest")
async def custom_quest(request: CustomQuest):
    return {"quest":{"category":"YOUR OWN ADVENTURE","title":request.title,"description":"Your idea. Your pace. Step away from the screen and make it happen.","time":f"{request.minutes} min","xp":35,"icon":"compass","color":"lavender","tag":"yours"}}

@app.get("/")
async def root():
    return {"message":"Touchgrass AI API is running. Visit /docs for API documentation."}
