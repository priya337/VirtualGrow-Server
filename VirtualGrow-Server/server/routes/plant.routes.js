const router = require("express").Router();
const PlantModel = require("../models/Plant.model")

router.post("/create", async (req, res) => {
  try {
    const createdPlant = await PlantModel.create(req.body)
    console.log ("plant created", createdPlant)
    res.status(201).json({message: 'plant created', createdPlant})
  } catch (error) {
    console.log(error)
    res.status(500).json({message: "Error creating a plant"})
  }
});

router.get("/allPlants/:userId", async (req, res) => {
    const theUserId = req.params.userId
    try {
      const allmyPlants = await PlantModel.find({theUserId}).populate()
      console.log ("here are all your plants", allmyPlants)
      res.status(201).json({ allmyPlants})
    } catch (error) {
      res.status(500).json({message: "Error getting your plants"})
    }
  });


router.put("/edit/:_id", async (req, res) => {
    try {
      const plantEdited = await PlantModel.findByIdAndUpdate(
        req.params._id,
        req.body,
        { new: true }
      );
      if (!plantEdited) return res.status(404).json({ error: "Plant not found" });
      res.status(200).json(plantEdited);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:_id", async (req, res) => {
    try {
      const plantDeleted = await PlantModel.findByIdAndDelete(req.params._id);
      if (!plantDeleted) return res.status(404).json({ error: "Plant not found" });
      res.status(204).end(plantDeleted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  module.exports = router;