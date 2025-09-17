const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

// First, insert the games
const games = [
  {
    Id: "game-cp2077",
    Name: "Cyberpunk 2077",
    Description: "An open-world, action-adventure RPG set in Night City, a megalopolis obsessed with power, glamour and body modification.",
    ImagePath: "/images/games/cyberpunk2077.jpg"
  },
  {
    Id: "game-witcher3",
    Name: "The Witcher 3: Wild Hunt",
    Description: "A story-driven, open-world adventure set in a dark fantasy universe where you play as a monster hunter tasked with finding a child of prophecy.",
    ImagePath: "/images/games/witcher3.jpg"
  },
  {
    Id: "game-eldenring",
    Name: "Elden Ring",
    Description: "An action RPG developed by FromSoftware in collaboration with George R.R. Martin, featuring a vast open world with intricate dungeons and challenging combat.",
    ImagePath: "/images/games/eldenring.jpg"
  },
  {
    Id: "game-gowr",
    Name: "God of War Ragnarök",
    Description: "Join Kratos and Atreus on a mythic journey for answers before Ragnarök arrives. Together, father and son must put everything on the line as they journey to each of the Nine Realms.",
    ImagePath: "/images/games/godofwar.jpg"
  },
  {
    Id: "game-horizon",
    Name: "Horizon Forbidden West",
    Description: "Brave an expansive open world and discover new tribes, mysterious machines, and hidden threats that will push Aloy to her limits as she returns to save humanity.",
    ImagePath: "/images/games/horizon.jpg"
  }
];

// Function to insert a single item
const insertItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item
  };
  
  try {
    await docClient.put(params).promise();
    console.log(`Successfully inserted item into ${tableName}`);
  } catch (err) {
    console.error(`Error inserting into ${tableName}:`, err);
  }
};

// Insert games first
const insertGames = async () => {
  for (const game of games) {
    await insertItem("NPCForge_Game", game);
  }
};

// Now create NPCs for each game
const npcs = [
  // Cyberpunk 2077 NPCs
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
    ImagePath: "/images/npcs/cyberpunk/judy.png"
  },
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-cp2077",
    Name: "Johnny Silverhand",
    Description: "Digital ghost of a legendary rockerboy with a vendetta",
    Backstory: "Former lead singer of the chrome rock band Samurai and legendary rockerboy who fought against corporate oppression. After a failed assault on Arasaka Tower in 2023, his consciousness was stored in a biochip, the Relic.",
    ExampleSpeech: "Wake up, samurai. We have a city to burn.",
    Gender: "Male",
    Accent: "American, rough and confrontational",
    Information: {
      Occupation: "Former Rockerboy",
      Affiliation: "Anti-corporate terrorist",
      Location: "Digital construct within V's mind"
    },
    ApiEndpoint: "/api/npcs/johnny-silverhand",
    ImagePath: "/images/npcs/cyberpunk/johnny.png"
  },

  // The Witcher 3 NPCs
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
    ImagePath: "/images/npcs/witcher3/yennefer.png"
  },
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-witcher3",
    Name: "Dandelion (Jaskier)",
    Description: "Flamboyant bard and Geralt's longtime friend",
    Backstory: "Graduated from Oxenfurt Academy with honors before becoming a traveling poet, minstrel, and the Continent's most famous troubadour. He has accompanied Geralt on many adventures, often getting them both into trouble through his womanizing and tendency to exaggerate tales.",
    ExampleSpeech: "Toss a coin to your Witcher, O Valley of Plenty!",
    Gender: "Male",
    Accent: "Theatrical British",
    Information: {
      Occupation: "Bard and Poet",
      Affiliation: "Oxenfurt Academy (alumni)",
      Location: "Various, owns The Chameleon in Novigrad"
    },
    ApiEndpoint: "/api/npcs/dandelion",
    ImagePath: "/images/npcs/witcher3/dandelion.png"
  },

  // Elden Ring NPCs
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
    ImagePath: "/images/npcs/eldenring/melina.png"
  },
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-eldenring",
    Name: "Blaidd the Half-Wolf",
    Description: "Half-wolf warrior bound by fate to serve Ranni",
    Backstory: "A shadow empyrean born to serve as Ranni the Witch's protector and shadow. He is loyal to a fault, serving Ranni even as her goals conflict with the Greater Will that created him.",
    ExampleSpeech: "Well, well. Lookee here. Another rat come to loot and despoil?",
    Gender: "Male",
    Accent: "Welsh",
    Information: {
      Occupation: "Shadow",
      Affiliation: "Ranni the Witch",
      Location: "Mistwood Ruins, Siofra River"
    },
    ApiEndpoint: "/api/npcs/blaidd",
    ImagePath: "/images/npcs/eldenring/blaidd.png"
  },

  // God of War Ragnarök NPCs
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
    ImagePath: "/images/npcs/gow/mimir.png"
  },
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-gowr",
    Name: "Freya",
    Description: "Former Queen of the Valkyries seeking vengeance",
    Backstory: "Once the loving wife of Odin and Queen of the Valkyries, Freya was stripped of her warrior spirit and banished to Midgard after betraying Odin. She later befriended Kratos and Atreus, but turned against them after Kratos killed her son Baldur, swearing vengeance.",
    ExampleSpeech: "You will pay for what you've done to my son. My vengeance is just beginning.",
    Gender: "Female",
    Accent: "Refined British",
    Information: {
      Occupation: "Witch of the Woods, Former Valkyrie Queen",
      Affiliation: "None (formerly Aesir)",
      Location: "Midgard"
    },
    ApiEndpoint: "/api/npcs/freya",
    ImagePath: "/images/npcs/gow/freya.png"
  },

  // Horizon Forbidden West NPCs
  {
    Id: "npc-" + uuidv4(),
    GameId: "game-horizon",
    Name: "Varl",
    Description: "Loyal Nora brave and Aloy's trusted friend",
    Backstory: "The son of War-Chief Sona, Varl is a mighty warrior of the Nora tribe. After proving himself in battle against the Eclipse, he became one of Aloy's most trusted allies. Despite his traditional upbringing, he's open-minded and willing to challenge his tribe's isolationist views.",
    ExampleSpeech: "You're going to the Forbidden West? Then I'm going too. You don't have to do this alone.",
    Gender: "Male",
    Accent: "American",
    Information: {
      Occupation: "Warrior/Brave",
      Affiliation: "Nora Tribe",
      Location: "Varies, originally from the Sacred Land"
    },
    ApiEndpoint: "/api/npcs/varl",
    ImagePath: "/images/npcs/horizon/varl.png"
  },
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
    ImagePath: "/images/npcs/horizon/sylens.png"
  }
];

// Insert all NPCs
const insertNPCs = async () => {
  for (const npc of npcs) {
    await insertItem("NPCForge_NPC", npc);
  }
};

// Function to run everything in the correct order
const populateDatabase = async () => {
  console.log("Starting database population...");
  
  // Insert games first
  await insertGames();
  console.log("Games inserted successfully.");
  
  // Then insert NPCs
  await insertNPCs();
  console.log("NPCs inserted successfully.");
  
  console.log("Database population complete!");
};

// Execute the population
populateDatabase().catch(err => {
  console.error("Error during database population:", err);
});