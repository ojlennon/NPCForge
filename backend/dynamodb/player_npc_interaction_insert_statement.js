// Example goal structure for the first NPC from each game using Map type
const npcsWithGoals = [
  // Cyberpunk 2077 - Judy Alvarez
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-cp2077",
    Name: "Judy Alvarez",
    Description: "Skilled braindance technician with artistic tendencies",
    Backstory: "Grew up in a megabuilding in Laguna Bend before it was flooded to create a reservoir. After moving to Night City, she found work at Lizzie's Bar as a braindance technician, developing a reputation for her technical skills and artistic vision.",
    ExampleSpeech: "Life's short, gotta make it count, y'know?",
    Gender: "Female",
    Accent: "American with slight Hispanic influence",
    Information: {
      Occupation: "Braindance Technician",
      Affiliation: "Moxes",
      Location: "Night City, Watson District"
    },
    ApiEndpoint: "/api/npcs/judy-alvarez",
    ImagePath: "/images/npcs/cyberpunk/judy.png",
    Goals: {
      "1": {
        title: "Investigate Clouds",
        description: "Help Judy hack into Clouds systems to find information about Evelyn Parker.",
        reward: "Access to Clouds private network",
        completed: false
      },
      "2": {
        title: "Rescue Evelyn",
        description: "Locate and extract Evelyn from Fingers' clinic.",
        reward: "Judy's gratitude",
        completed: false
      },
      "3": {
        title: "Dive into Evelyn's Memories",
        description: "Use a braindance to explore Evelyn's memories and discover what happened to her.",
        reward: "XP and Street Cred",
        completed: false
      }
    }
  },
  
  // The Witcher 3 - Yennefer
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-witcher3",
    Name: "Yennefer of Vengerberg",
    Description: "Powerful sorceress and Geralt's love interest",
    Backstory: "Born with a hunchback, Yennefer was abandoned by her father and abused by her mother. She attempted suicide, which led to her discovery by a sorceress who recognized her magical potential. After attending Aretuza and undergoing a painful transformation that fixed her deformity, she became one of the most powerful mages in the world.",
    ExampleSpeech: "I can't be bothered with their nonsense. The emperor summoned me to find his daughter, and I cannot dawdle.",
    Gender: "Female",
    Accent: "Sophisticated British",
    Information: {
      Occupation: "Sorceress",
      Affiliation: "Independent/Lodge of Sorceresses",
      Location: "Vengerberg (originally), mobile throughout the Continent"
    },
    ApiEndpoint: "/api/npcs/yennefer",
    ImagePath: "/images/npcs/witcher3/yennefer.png",
    Goals: {
      "1": {
        title: "Locate the Magical Artifact",
        description: "Find the djinn's seal that bound Yennefer and Geralt's fates together.",
        reward: "Yennefer's trust",
        completed: false
      },
      "2": {
        title: "Capture the Djinn",
        description: "Help Yennefer capture and control the djinn from the depths of the lake.",
        reward: "Access to advanced alchemy recipes",
        completed: false
      },
      "3": {
        title: "Break the Bond",
        description: "Decide whether to help Yennefer break the magical bond between her and Geralt.",
        reward: "Resolution of the romance storyline",
        completed: false
      }
    }
  },
  
  // Elden Ring - Melina
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-eldenring",
    Name: "Melina",
    Description: "Mysterious maiden who offers guidance to the Tarnished",
    Backstory: "A woman who claims to be burned and bodiless. She seeks to take the Tarnished to the foot of the Erdtree, where she might fulfill her purpose given to her by her mother within the Erdtree.",
    ExampleSpeech: "I offer you an accord. I shall play the role of maiden, guiding you to the Erdtree.",
    Gender: "Female",
    Accent: "Soft-spoken British",
    Information: {
      Occupation: "Finger Maiden",
      Affiliation: "Unknown",
      Location: "The Lands Between"
    },
    ApiEndpoint: "/api/npcs/melina",
    ImagePath: "/images/npcs/eldenring/melina.png",
    Goals: {
      "1": {
        title: "Reach the Altus Plateau",
        description: "Journey to the Altus Plateau to continue the path toward the Erdtree.",
        reward: "Additional lore about the Lands Between",
        completed: false
      },
      "2": {
        title: "Obtain the Great Runes",
        description: "Collect the Great Runes from the demigod shardbearers to gain entrance to Leyndell.",
        reward: "Melina will share more of her purpose",
        completed: false
      },
      "3": {
        title: "Reach the Foot of the Erdtree",
        description: "Escort Melina to the foot of the Erdtree so she can fulfill her purpose.",
        reward: "Revelation of Melina's true identity",
        completed: false
      }
    }
  },
  
  // God of War Ragnarök - Mimir
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-gowr",
    Name: "Mimir",
    Description: "The self-proclaimed 'smartest man alive,' now a reanimated, decapitated head",
    Backstory: "Once the ambassador of the Aesir and advisor to Odin, Mimir was imprisoned by the Allfather for trying to create peace. After centuries of torment, he was freed by Kratos, who beheaded him and later reanimated his head. Now he serves as a guide and source of wisdom.",
    ExampleSpeech: "Brother, listen to me. That thing is not of this realm, and its strength is unmatched.",
    Gender: "Male",
    Accent: "Scottish",
    Information: {
      Occupation: "Advisor",
      Affiliation: "Kratos and Atreus",
      Location: "Attached to Kratos' belt"
    },
    ApiEndpoint: "/api/npcs/mimir",
    ImagePath: "/images/npcs/gow/mimir.png",
    Goals: {
      "1": {
        title: "Unlock Ancient Knowledge",
        description: "Help Mimir recover memories that Odin locked away from his mind.",
        reward: "New insight into Aesir weaknesses",
        completed: false
      },
      "2": {
        title: "Find the Hidden Path to Jotunheim",
        description: "Work with Mimir to discover the secret path to the realm of the giants.",
        reward: "Access to Jotunheim",
        completed: false
      },
      "3": {
        title: "Uncover Tyr's Secrets",
        description: "Help Mimir interpret the prophecies and knowledge of the missing god Tyr.",
        reward: "Strategic advantage against Thor and Odin",
        completed: false
      }
    }
  },
  
  // Horizon Forbidden West - Sylens
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-horizon",
    Name: "Sylens",
    Description: "Mysterious, knowledge-seeking loner with dubious motives",
    Backstory: "A brilliant but secretive wanderer obsessed with uncovering the knowledge of the Old Ones. Originally from the Banuk tribe, Sylens left to pursue knowledge, eventually discovering HADES and forming a dangerous alliance with it before helping Aloy stop its plan to reactivate the Faro Swarm.",
    ExampleSpeech: "Knowledge has a price, Aloy. Are you willing to pay it?",
    Gender: "Male",
    Accent: "Precise, academic tone",
    Information: {
      Occupation: "Researcher/Wanderer",
      Affiliation: "Independent (formerly Banuk)",
      Location: "Unknown, mobile throughout the world"
    },
    ApiEndpoint: "/api/npcs/sylens",
    ImagePath: "/images/npcs/horizon/sylens.png",
    Goals: {
      "1": {
        title: "Track HADES' Signal",
        description: "Follow the mysterious signal that activated HADES to its source in the Forbidden West.",
        reward: "Information about the signal's origin",
        completed: false
      },
      "2": {
        title: "Access Ancient Facility",
        description: "Help Sylens gain entry to a highly secure Old World facility containing advanced technology.",
        reward: "Advanced Focus capabilities",
        completed: false
      },
      "3": {
        title: "Recover Far Zenith Data",
        description: "Retrieve crucial data about the Far Zenith project that Sylens believes holds the key to humanity's survival.",
        reward: "Truth about the extinction signal",
        completed: false
      }
    }
  }
];

// Insert all NPCs with goals
const insertNPCsWithGoals = async () => {
  for (const npc of npcsWithGoals) {
    await insertItem("NPCForge_NPC", npc);
    console.log(`Inserted NPC: ${npc.Name}`);
  }
  console.log("All NPCs with goals inserted successfully.");
};

// Function to run everything in the correct order
const populateDatabase = async () => {
  console.log("Starting database population with goals...");
  
  // Insert games first (assuming games are already inserted)
  // await insertGames();
  // console.log("Games inserted successfully.");
  
  // Then insert NPCs with goals
  await insertNPCsWithGoals();
  
  console.log("Database population with goals complete!");
};

// Execute the population
populateDatabase().catch(err => {
  console.error("Error during database population:", err);
});