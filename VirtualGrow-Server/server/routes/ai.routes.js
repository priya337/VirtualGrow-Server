import express from "express";
import OpenAI from "openai";
import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// ✅ Ensure correct import for the Garden model (using relative path)
import Garden from "../models/Garden.model.js";  
import Image from "../models/Image.model.js"; 

const router = express.Router();

// ✅ Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🌱 Generate Garden Plan and Image
router.post("/generate-garden-overview", async (req, res) => {
  try {
    console.log("🔍 Debug: Raw request body received:", req.body);

    const { name, gardenSize, preferredPlants } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required in the request body." });
    }

    console.log("✅ Parsed values:", { name, gardenSize, preferredPlants });

    // ✅ Check if Garden Name Already Exists
    const existingGarden = await Garden.findOne({ name });
    if (existingGarden) {
      return res.status(400).json({ error: "Garden name already exists. Choose another name." });
    }

    // ✅ AI Prompt for Generating Garden Layout
    const overviewPrompt = `
      You are an expert garden planner. Generate a **Garden Plan Overview** in valid JSON format only.
      The following details should be exact details and not details like eg: plants count depends se , I am not sure etc.. 
      Please also ensure to provide the exact names of the plants when providing the details of 
      plant placements , water scheduling.
      Please also ensure to include the space details between similar Preferred as well as Companion Plants.
      Ensure it includes:
      1. **Layout Suggestions**: Garden shape, pathways, relaxation zone.(
      2. **Plant Placement of PreferredPlants**: Count of plants and be reasonable on the count for example: Apple, Orange , Oak , Mango are grown as trees which can take quite some space, spacing details between same preferred plants, spacing details between different preferred plants. For example:"PreferredPlants": [
        {
          "PlantName": "RoseMary",
          "Count of RoseMary plants that can be planted based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m ": 3,
          "SpacingDetails": {
            RoseMary from RoseMary: "0.5m"
            Oak from RoseMary: "1m"
          }
        },
        {
          "PlantName": "Oak",
          "Count of Oak that can be planted Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m": 2,
          "SpacingDetails": {
            Oak from Oak: "0.5m"
            Oak from RoseMary: "1m"
          }
        }
      ]
    },
      3. **Seasonal Planting along with PreferredPlants**: List of recommended companion plants with reference to list of PreferredPlants and seasons ( Summer, Spring, Winter and Autumn)
      4. ** Plant Placement of Seasonal Plants along with Preferred Plants**: Count of companion plants for respective seasons along with preferredPlants, spacing details of every companion Plant from every listed prefrerredPlants, companion plants and its own type of plants based on respective seasons, 
      For example: 
      Spring:{
        "CompanionPlants": [
          "Sunflower",
          "Daisy"
        ],
       "Count of Sunflower plants that can be planted based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
       "Count of Daisy plants that can be planted based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m" and Count of preferredPlants Lotus as well as Roses: 2
       "SpacingDetails": {
        Spring: {
        "Lotus from Marigold": "1.5m",
        "Roses from Marigold": "1m", 
        "Roses from Lavender": "1m", 
        "Lotus from Lavender": "1m", 
        "Lavender from Lavender": "1m", 
        "Marigold from Lavender": "1m", 
        "Marigold from Marigold": "1m"
        }
      }
        Summer: {
          "CompanionPlants": [
            "Sunflower",
            "Daisy"
          ],
         "Count of Sunflower based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
         "Count of Daisy based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses": 2
         "SpacingDetails":{
          "Lotus from Sunflower": "1.5m",
          "Roses from Sunflower": "1m", 
          "Roses from Daisy": "1m", 
          "Lotus from Daisy": "1m", 
          "Daisy from Daisy": "1m", 
          "Sunflower from Sunflower": "1m", 
          "Daisy from Sunflower": "1m"
          }
      }
      Winter: {
        "CompanionPlants": [
          "Sunflower",
          "Daisy"
        ],
       "Count of Sunflower based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
       "Count of Daisy based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses": 2
       "SpacingDetails":{
        "Lotus from Sunflower": "1.5m",
        "Roses from Sunflower": "1m", 
        "Roses from Daisy": "1m", 
        "Lotus from Daisy": "1m", 
        "Daisy from Daisy": "1m", 
        "Sunflower from Sunflower": "1m", 
        "Daisy from Sunflower": "1m"
        }
    }
    Autumn: {
      "CompanionPlants": [
        "Sunflower",
        "Daisy"
      ],
     "Count of Sunflower based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
     "Count of Daisy based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses": 2
     "SpacingDetails":{
      "Lotus from Sunflower": "1.5m",
      "Roses from Sunflower": "1m", 
      "Roses from Daisy": "1m", 
      "Lotus from Daisy": "1m", 
      "Daisy from Daisy": "1m", 
      "Sunflower from Sunflower": "1m", 
      "Daisy from Sunflower": "1m"
      }
  }
      5. **Seasonal Watering for PreferredPlants**: Number of times per day respective preferred plants needs to be watered during Spring, Summer , Winter and Autumn Eg: Spring "Bouganvilla": 1 time per day. 
      6. **Seasonal Watering for CompanionPlants**: Number of times per day respective companion plants needs to be watered during Spring, Summer , Winter and Autumn.  Eg: Spring "Marigold": 1 time per day , Winter "Marigold": No water needed etc..
      7. **Soil Considerations for PreferredPlants**: The soil that needs to be considered for respective preferredPlants and how frequently the soil needs to be changed. 
      8. **Soil Considerations for CompanionPlants**: The soil that needs to be considered for respective preferredPlants and how frequently the soil needs to be changed. 
      9. **Seasonal Behaviour of PreferredPlants**: The behaviour of the respective companion Plants during Spring, Summer , Winter and Autumn and recommendations to handle them 
      for respective 4 seasons. For example: Winter "Bouganvilla": They cannot handle frost. Cut down the plants and plant them again in Summer. 
      10. **Seasonal Behaviour of CompanionPlants**: The behaviour of the respective companionPlants during Spring, Summer , Winter and Autumn and recommendations to handle them 
      for respective 4 seasons. For example: Summer "Marigold": Cannot handle summer , Winter "Marigold" : Not winter Plant , Autumn "Marigold" : Still Blooms.  
      11. **Recommended ways of growing Preferred and Companion Plants**: What are the ways the preferredPlants and companion Plants can be grown based on Layout Suggestions respectively . For example: {
        "CompanionPlants": [
          "Sunflower": "Can be grown as hanging plant" ,
          "Daisy": "Can be grown on pot"
        ], 
          "PreferredPlants": [
            "Sunflower": "Can be grown as hanging plant" ,
            "Daisy": "Can be grown on pot"  
          ]
        }
      only in pot etc .. Eg: Companion Plant "Marigold": Can be grown in 10*12 flowerbed or medium pot , Preferred Plant "Bouganvilla" : Cab be grown as creeper as well as on 10*14 flowerbed.
      12. **Recommended plants that can be grown throughout the year**: What are the recommended preferred plants and companion plants that can be grown throughout the year? 
      13. **Watering schedule of Recommended plants that can be grown throughout the year** : What would be the watering schedule of recommended companion plants for respective seasons? Eg: Spring "Bouganvilla": 1 time per day. 
      14. **Plants placement of Recommended plants that can be grown throughout the year** :What would be plants count of prefrerredPlants and companion plants based on Garden Size if the recommended once are considered to be 
      grown throughout the year? (it would be good to have the names of the plants as well). For example : Banana Count: 1 , Marigold Count: 1 


      Now generate a JSON response based on:
      - Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m
      - Preferred Plants: ${preferredPlants.join(", ")}

      ⚠️ Ensure the response is **valid JSON** with no extra text or explanations. Do NOT include markdown (e.g., \`\`\`json). Output ONLY the JSON.
    `;

    // ✅ Call OpenAI GPT Model for Garden Plan Overview
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: overviewPrompt }],
      temperature: 0.7,
    });

    let gardenPlanOverview = aiResponse.choices[0].message.content;

    // ✅ Ensure Response is Valid JSON
    try {
      gardenPlanOverview = JSON.parse(gardenPlanOverview);
    } catch (jsonError) {
      console.error("❌ JSON Parsing Error:", jsonError.message);
      return res.status(500).json({ error: "AI returned invalid JSON", details: jsonError.message });
    }

    // ✅ Store in Database
    const newGarden = new Garden({
      name,  // Ensure name is correctly passed
      gardenSize,
      preferredPlants,
      gardenPlanOverview,
    });

    const savedGarden = await newGarden.save();

    return res.status(201).json({
      message: "Garden generated successfully",
      gardenId: savedGarden._id,
      name: savedGarden.name,
      gardenSize: savedGarden.gardenSize,
      preferredPlants: savedGarden.preferredPlants,
      gardenPlanOverview: savedGarden.gardenPlanOverview,
    });

  } catch (error) {
    console.error("❌ AI Processing Error:", error);
    return res.status(500).json({ error: "AI processing failed", details: error.message });
  }
});

// ✅ Fetch Existing Garden Names
router.get("/garden/:name", async (req, res) => {
  try {
    const garden = await Garden.findOne({ name: req.params.name });
    if (!garden) {
      return res.status(404).json({ error: "Garden not found" });
    }
    return res.json(garden);
  } catch (error) {
    console.error("❌ Fetching Garden Error:", error.message);
    return res.status(500).json({ error: "Failed to retrieve garden", details: error.message });
  }
});


// POST /api/ai/saveImage
router.post("/saveImage", async (req, res) => {
  const { gardenName, imageUrl } = req.body;

  if (!gardenName || !imageUrl) {
    return res.status(400).json({ error: "Missing required fields: gardenName or imageUrl" });
  }

  try {
    // Update the garden’s imageUrl field
    const updatedGarden = await Garden.findOneAndUpdate(
      { name: gardenName },
      { imageUrl }, // overwrite the existing imageUrl
      { new: true } // return the updated document
    );

    if (!updatedGarden) {
      return res.status(404).json({ error: "Garden not found" });
    }

    res.status(200).json({
      message: "Garden image updated successfully",
      data: updatedGarden,
    });
  } catch (error) {
    console.error("Error updating garden image:", error);
    res.status(500).json({ error: "Server error updating garden image" });
  }
});


router.get('/images/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const images = await Image.find({ gardenName: name });
    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Server error fetching images' });
  }
});


router.get("/gardens", async (req, res) => {
  try {
    const gardens = await Garden.find({});
    if (!gardens || gardens.length === 0) {
      return res.status(200).json([]); // ✅ Return empty array if no gardens
    }
    res.json(gardens);
  } catch (error) {
    console.error("Error fetching gardens:", error);
    res.status(500).json({ error: "Failed to fetch gardens." });
  }
});

router.put("/garden/:name", async (req, res) => {
  try {
    const { name, gardenSize, preferredPlants } = req.body;
    const oldName = req.params.name;

    console.log(`🔍 Updating Garden: ${oldName} → ${name || oldName}`);

    // ✅ Find the Existing Garden (Even if Name is Unchanged)
    let garden = await Garden.findOne({ name: oldName });
    if (!garden) {
      return res.status(404).json({ error: "Garden not found" });
    }

    // ✅ Only Check for Duplicate Name if User Changed It
    if (name && name !== oldName) {
      const existingGarden = await Garden.findOne({ name });
      if (existingGarden) {
        console.log(`⚠️ Garden name "${name}" already exists. Keeping old name.`);
        // Instead of blocking, revert to the old name
        name = oldName;
      } else {
        garden.name = name;
      }
    }

    // ✅ Update Other Fields
    if (gardenSize) garden.gardenSize = gardenSize;
    if (preferredPlants) garden.preferredPlants = preferredPlants;

    await garden.save();
    console.log("✅ Garden details updated:", garden);

    // ✅ Use the Same AI Prompt from Create for Regeneration
    const overviewPrompt = `
    You are an expert garden planner. Generate a **Garden Plan Overview** in valid JSON format only.
    The following details should be exact details and not details like eg: plants count depends se , I am not sure etc.. 
    Please also ensure to provide the exact names of the plants when providing the details of 
    plant placements , water scheduling.
    Please also ensure to include the space details between similar Preferred as well as Companion Plants.
    Ensure it includes:
    1. **Layout Suggestions**: Garden shape, pathways, relaxation zone.(
    2. **Plant Placement of PreferredPlants**: Count of plants and be reasonable on the count for example: Apple, Orange , Oak , Mango are grown as trees which can take quite some space, spacing details between same preferred plants, spacing details between different preferred plants. For example:"PreferredPlants": [
      {
        "PlantName": "RoseMary",
        "Count of RoseMary plants that can be planted based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m ": 3,
        "SpacingDetails": {
          RoseMary from RoseMary: "0.5m"
          Oak from RoseMary: "1m"
        }
      },
      {
        "PlantName": "Oak",
        "Count of Oak that can be planted Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m": 2,
        "SpacingDetails": {
          Oak from Oak: "0.5m"
          Oak from RoseMary: "1m"
        }
      }
    ]
  },
    3. **Seasonal Planting along with PreferredPlants**: List of recommended companion plants with reference to list of PreferredPlants and seasons ( Summer, Spring, Winter and Autumn)
    4. ** Plant Placement of Seasonal Plants along with Preferred Plants**: Count of companion plants for respective seasons along with preferredPlants, spacing details of every companion Plant from every listed prefrerredPlants, companion plants and its own type of plants based on respective seasons, 
    For example: 
    Spring:{
      "CompanionPlants": [
        "Sunflower",
        "Daisy"
      ],
     "Count of Sunflower plants that can be planted based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
     "Count of Daisy plants that can be planted based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m" and Count of preferredPlants Lotus as well as Roses: 2
     "SpacingDetails": {
      Spring: {
      "Lotus from Marigold": "1.5m",
      "Roses from Marigold": "1m", 
      "Roses from Lavender": "1m", 
      "Lotus from Lavender": "1m", 
      "Lavender from Lavender": "1m", 
      "Marigold from Lavender": "1m", 
      "Marigold from Marigold": "1m"
      }
    }
      Summer: {
        "CompanionPlants": [
          "Sunflower",
          "Daisy"
        ],
       "Count of Sunflower based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
       "Count of Daisy based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses": 2
       "SpacingDetails":{
        "Lotus from Sunflower": "1.5m",
        "Roses from Sunflower": "1m", 
        "Roses from Daisy": "1m", 
        "Lotus from Daisy": "1m", 
        "Daisy from Daisy": "1m", 
        "Sunflower from Sunflower": "1m", 
        "Daisy from Sunflower": "1m"
        }
    }
    Winter: {
      "CompanionPlants": [
        "Sunflower",
        "Daisy"
      ],
     "Count of Sunflower based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
     "Count of Daisy based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses": 2
     "SpacingDetails":{
      "Lotus from Sunflower": "1.5m",
      "Roses from Sunflower": "1m", 
      "Roses from Daisy": "1m", 
      "Lotus from Daisy": "1m", 
      "Daisy from Daisy": "1m", 
      "Sunflower from Sunflower": "1m", 
      "Daisy from Sunflower": "1m"
      }
  }
  Autumn: {
    "CompanionPlants": [
      "Sunflower",
      "Daisy"
    ],
   "Count of Sunflower based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses" : 1
   "Count of Daisy based on Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m and Count of preferredPlants Lotus as well as Roses": 2
   "SpacingDetails":{
    "Lotus from Sunflower": "1.5m",
    "Roses from Sunflower": "1m", 
    "Roses from Daisy": "1m", 
    "Lotus from Daisy": "1m", 
    "Daisy from Daisy": "1m", 
    "Sunflower from Sunflower": "1m", 
    "Daisy from Sunflower": "1m"
    }
}
    5. **Seasonal Watering for PreferredPlants**: Number of times per day respective preferred plants needs to be watered during Spring, Summer , Winter and Autumn Eg: Spring "Bouganvilla": 1 time per day. 
    6. **Seasonal Watering for CompanionPlants**: Number of times per day respective companion plants needs to be watered during Spring, Summer , Winter and Autumn.  Eg: Spring "Marigold": 1 time per day , Winter "Marigold": No water needed etc..
    7. **Soil Considerations for PreferredPlants**: The soil that needs to be considered for respective preferredPlants and how frequently the soil needs to be changed. 
    8. **Soil Considerations for CompanionPlants**: The soil that needs to be considered for respective preferredPlants and how frequently the soil needs to be changed. 
    9. **Seasonal Behaviour of PreferredPlants**: The behaviour of the respective companion Plants during Spring, Summer , Winter and Autumn and recommendations to handle them 
    for respective 4 seasons. For example: Winter "Bouganvilla": They cannot handle frost. Cut down the plants and plant them again in Summer. 
    10. **Seasonal Behaviour of CompanionPlants**: The behaviour of the respective companionPlants during Spring, Summer , Winter and Autumn and recommendations to handle them 
    for respective 4 seasons. For example: Summer "Marigold": Cannot handle summer , Winter "Marigold" : Not winter Plant , Autumn "Marigold" : Still Blooms.  
    11. **Recommended ways of growing Preferred and Companion Plants**: What are the ways the preferredPlants and companion Plants can be grown based on Layout Suggestions respectively . For example: {
      "CompanionPlants": [
        "Sunflower": "Can be grown as hanging plant" ,
        "Daisy": "Can be grown on pot"
      ], 
        "PreferredPlants": [
          "Sunflower": "Can be grown as hanging plant" ,
          "Daisy": "Can be grown on pot"  
        ]
      }
    only in pot etc .. Eg: Companion Plant "Marigold": Can be grown in 10*12 flowerbed or medium pot , Preferred Plant "Bouganvilla" : Cab be grown as creeper as well as on 10*14 flowerbed.
    12. **Recommended plants that can be grown throughout the year**: What are the recommended preferred plants and companion plants that can be grown throughout the year? 
    13. **Watering schedule of Recommended plants that can be grown throughout the year** : What would be the watering schedule of recommended companion plants for respective seasons? Eg: Spring "Bouganvilla": 1 time per day. 
    14. **Plants placement of Recommended plants that can be grown throughout the year** :What would be plants count of prefrerredPlants and companion plants based on Garden Size if the recommended once are considered to be 
    grown throughout the year? (it would be good to have the names of the plants as well). For example : Banana Count: 1 , Marigold Count: 1 


    Now generate a JSON response based on:
    - Garden Size: ${gardenSize.length}m x ${gardenSize.breadth}m
    - Preferred Plants: ${preferredPlants.join(", ")}

    ⚠️ Ensure the response is **valid JSON** with no extra text or explanations. Do NOT include markdown (e.g., \`\`\`json). Output ONLY the JSON.
  `;

    // ✅ Call OpenAI API for Regeneration
    try {
      console.log("🔄 Regenerating AI Garden Plan...");
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: overviewPrompt }],
        temperature: 0.7,
      });

      let gardenPlanOverview = aiResponse.choices[0].message.content;

      // ✅ Ensure Response is Valid JSON
      try {
        gardenPlanOverview = JSON.parse(gardenPlanOverview);
      } catch (jsonError) {
        console.error("❌ JSON Parsing Error:", jsonError.message);
        return res.status(500).json({ error: "AI returned invalid JSON", details: jsonError.message });
      }

      // ✅ Save AI-generated plan
      garden.gardenPlanOverview = gardenPlanOverview;
      await garden.save();
      console.log("✅ AI Plan Regenerated Successfully");

      res.json({ message: "Garden updated successfully with regenerated AI plan", garden });

    } catch (aiError) {
      console.error("❌ AI Plan Generation Failed:", aiError);
      return res.status(500).json({ error: "Failed to generate AI garden plan" });
    }

  } catch (error) {
    console.error("❌ Error updating garden:", error);
    res.status(500).json({ error: "Failed to update garden" });
  }
});

    
// DELETE route to delete a garden by name
router.delete("/garden/:name", async (req, res) => {
  try {
    const gardenName = decodeURIComponent(req.params.name).trim();
    console.log(`Attempting to delete: "${gardenName}"`); // Debugging log

    // ✅ Case-insensitive search
    const deletedGarden = await Garden.findOneAndDelete({
      name: { $regex: new RegExp(`^${gardenName}$`, "i") }
    });

    if (!deletedGarden) {
      console.log(`Garden not found: "${gardenName}"`); // Debugging log
      return res.status(404).json({ message: `Garden "${gardenName}" not found` });
    }

    console.log(`Successfully deleted: "${gardenName}"`);
    res.json({ message: `AI Garden "${gardenName}" has been deleted successfully!` });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete the garden" });
  }
});


// ✅ Retrieve Garden by ID
router.get("/garden/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`🔍 Searching for Garden with identifier: "${identifier}"`);

    let garden = null;

    // ✅ Force Convert to ObjectId if it is a valid ID
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      console.log(`🆔 Identifier "${identifier}" is a valid ObjectId. Querying by _id...`);
      try {
        garden = await Garden.findById(new mongoose.Types.ObjectId(identifier));
        console.log("📝 MongoDB Query Result by _id:", garden);
      } catch (error) {
        console.log(`⚠️ MongoDB Error on _id search: ${error.message}`);
      }
    }

    // ✅ If no result from `_id`, search by `name`
    if (!garden) {
      console.log(`🔠 Identifier "${identifier}" is NOT a valid ObjectId or was not found. Querying by name...`);
      garden = await Garden.findOne({ name: new RegExp(`^${identifier}$`, "i") });
      console.log("📝 MongoDB Query Result by name:", garden);
    }

    // 🔴 If no garden is found, log failure and return 404
    if (!garden) {
      console.log("❌ Garden not found in database.");
      return res.status(404).json({ error: "Garden not found" });
    }

    // ✅ Return found garden
    return res.json(garden);

  } catch (error) {
    console.error("❌ Fetching Garden Error:", error.message);
    return res.status(500).json({ error: "Failed to retrieve garden", details: error.message });
  }
});

// ✅ Test Route
router.get("/", (req, res) => {
  return res.send("AI routes are working!");
});

// ✅ Ensure Proper Default Export
export default router;
