
# **AyurBalance — Personalized Ayurvedic Diet Planner**

**A smart wellness platform that generates personalized Ayurvedic diet plans based on dosha type, seasons, and health goals. It combines Ayurvedic principles with modern tech, offering an intuitive UI and AI-powered guidance.**

---

## **Key Features**

### **Prakriti Analysis**

* Weighted Prakriti (dosha) quiz to determine primary and secondary doshas.

### **Adaptive Diet Planning**

* Personalized meal plans tailored by dosha, season, and fitness goals.
* Includes basic macros and nutritional alignment.

### **Foods Explorer**

* Search and filter from **300+ Ayurvedic foods** by dosha, season, category, or keywords.

### **AI Wellness Advisory**

* Context-aware tips powered by **Hugging Face Router** via `/chat`.
* Offers lifestyle, diet, and daily routine guidance based on user profile.

### **PDF Export**

* One-click generation of a professional and readable diet-plan PDF.

### **Community UI**

* Lightweight forum-style interaction (local storage based).

### **Health Check**

* `/health` endpoint for instant backend verification.

---

## **Tech Stack**

**Backend:** Node.js (ESM), Express, MongoDB, JWT, bcryptjs, Zod, axios

**AI Integration:** Hugging Face Router (chat advisory)

**Frontend:** HTML, Tailwind CSS (CDN), Vanilla JavaScript

**Tooling:** Nodemon, dotenv

