<!-- routes/chat/+page.svelte (if using SvelteKit) or Chat.svelte (if not) -->
<script lang="ts">
  import { beforeUpdate, onMount } from "svelte";
  import { io, Socket } from "socket.io-client"; // Make sure to install socket.io-client and @types/socket.io-client
  import { AudioPlayer } from "$lib/play/AudioPlayer";
  import { ChatHistoryManager } from "$lib/util/ChatHistoryManager";
  import { page } from "$app/stores";

  // DOM element references (using Svelte bindings)
  let statusElement: HTMLDivElement;
  let chatContainer: HTMLDivElement;
  let startButton: HTMLButtonElement;
  let stopButton: HTMLButtonElement;

  // Chat state
  interface Chat {
    history: Array<{
      role?: string;
      message?: string;
      endOfConversation?: boolean;
    }>;
  }

  let chat: Chat = { history: [] };
  let chatRef: { current: Chat } = { current: chat };
  let chatHistoryManager: any;

  // Audio processing variables
  let audioContext: AudioContext;
  let audioStream: MediaStream;
  let isStreaming: boolean = false;
  let processor: ScriptProcessorNode;
  let sourceNode: MediaStreamAudioSourceNode;
  let waitingForAssistantResponse: boolean = false;
  let waitingForUserTranscription: boolean = false;
  let userThinkingIndicator: HTMLDivElement | null = null;
  let assistantThinkingIndicator: HTMLDivElement | null = null;
  let transcriptionReceived: boolean = false;
  let displayAssistantText: boolean = false;
  let role: string;
  let audioPlayer: AudioPlayer;
  let sessionInitialized: boolean = false;
  let samplingRatio: number = 1;
  const TARGET_SAMPLE_RATE: number = 16000;
  const isFirefox: boolean =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("firefox");
  let socket: Socket;
  $: npcId = $page.url.searchParams.get("npcId");
  let jsonPrompt = "";
  let SYSTEM_PROMPT = "";

  const fetchNPC = async (npcId: string): Promise<string> => {
    try {
      const response = await fetch(`/chat?npcId=${encodeURIComponent(npcId)}`);
      const data = await response.json();
      if (data.success && data.npc) {
        // Convert the NPC object to a formatted JSON string
        console.log(JSON.stringify(data.npc, null, 2));
        return JSON.stringify(data.npc, null, 2); // The '2' adds indentation for readability
      } else {
        console.error("NPC data not found or invalid");
        return "";
      }
    } catch (error) {
      console.error("Error fetching NPC data:", error);
      return "";
    }
  };

  beforeUpdate(async () => {
    if (npcId && !jsonPrompt) {
      try {
        jsonPrompt = await fetchNPC(npcId);
        const promptSetup =
          "You are a character in a video game. Do not ever admit that you are AI. Do not ask the player what they need help with, or if you can be of assistance. The following information is the role in the video game that you are about to assume. \
      You will also recieve a summary of your past interactions with the player. Be sure to factor that information into this interaction wtih the character. For example, if they were mean to you, feel free to be less cooperative. \
      You just had an interaction wtih the player where they gave you a cruicial piece of information about how to fix your arm. you want to thank them and give them information about a secret to maps. some of them glow in the dark and reveal hidden information.";
        SYSTEM_PROMPT = promptSetup + jsonPrompt;
        console.log(SYSTEM_PROMPT);
      } catch (error) {
        console.error("Failed to load NPC data:", error);
      }
    }
  });
  // JSON.stringify({
  //   Id: { S: "58d4dd5b-e43c-4970-a53c-228ac729e301" },
  //   GameId: { S: "RPG12345" },
  //   Accent: { S: "american" },
  //   APIEvalPoint: { S: "character_interaction_v1" },
  //   Backstory: {
  //     S: "Malenia was one of the twin children born to Queen Marika the Eternal and her second Elden Lord, Radagon.[2] As Empyreans, both Malenia and her elder twin brother, Miquella,[3] were candidates to ascend as gods of a new age.[4] However, due to the nature of their parentage, the twins were afflicted with dreadful curses. Miquella was doomed with eternal nascency, while Malenia's body was ravaged by the scarlet rot.\r\n\r\nThe scarlet rot plagued Malenia from within, gradually consuming her and leaving her disfigured. Over time, she lost her eyes and several limbs to the rot. Despite her suffering, Malenia fought valiantly to suppress the rot’s influence, refusing to succumb to its ruinous nature.[citation needed]\r\n\r\nMiquella worked tirelessly to undo the curses they had both inherited. While unable to find a cure for his sister within the Golden Order, Miquella designed a needle of unalloyed gold to keep the rot at bay.[5] He also crafted the prostheses that enabled her to continue fighting.[verification needed]\r\n\r\nAt some point, Malenia encountered the legendary blind swordsman of the Flowing Curved Sword, who had long ago sealed away an Outer God of Rot.[6] The swordsman became her master,[7] enabling her to gain wings of unparalleled strength.[8] Malenia eventually became a peerless warrior and her brother's sworn blade and protector.\r\n\r\nYou are about to engage in battle with the player. "
  //   },
  //   CreatedAt: { S: "2025-06-17T05:25:16.338Z" },
  //   Description: {
  //     S: "Malenia, blade of Miquella. An optional Elden ring boss notorious for her difficulty."
  //   },
  //   ExampleSpeech: {
  //     S: "I dreamt for so long. My flesh was dull gold... and my blood, rotted. Corpse after corpse, left in my wake. As I awaited... his return.\r\n\r\ncyptic and in an elden way."
  //   },
  //   Gender: { S: "female" },
  //   ImagePath: {
  //     S: "https://npcforge-images.s3.amazonaws.com/npc/1750137915397-images.jpg"
  //   },
  //   Information: { S: "[]" },
  //   Name: { S: "Malenia" },
  //   UpdatedAt: { S: "2025-06-17T05:25:16.338Z" }
  // });

  // Custom system prompt

  // Define types for socket data
  interface ContentStartData {
    type: string;
    role: string;
    additionalModelFields?: string;
  }

  interface TextOutputData {
    role: string;
    content: string;
  }

  interface ContentEndData {
    type: string;
    stopReason?: string;
  }

  interface AudioOutputData {
    content: string;
  }

  onMount(() => {
    // Initialize socket
    socket = io("https://express-npcforge.cloud303.tech");

    // Set up socket event handlers
    setupSocketHandlers();

    // Initialize audio player and chat history manager
    audioPlayer = new AudioPlayer();
    chatHistoryManager = ChatHistoryManager.getInstance(
      chatRef,
      (newChat: Chat) => {
        chat = { ...newChat };
        chatRef.current = chat;
        updateChatUI();
      }
    );

    // Initialize audio when the page loads
    initAudio();

    return () => {
      // Clean up on component unmount
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (socket) {
        socket.disconnect();
      }
      if (audioPlayer) {
        audioPlayer.stop();
      }
    };
  });

  async function initAudio(): Promise<void> {
    try {
      statusElement.textContent = "Requesting microphone access...";
      statusElement.className = "connecting";

      // Request microphone access
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (isFirefox) {
        //firefox doesn't allow audio context have differnt sample rate than what the user media device offers
        audioContext = new AudioContext();
      } else {
        audioContext = new AudioContext({
          sampleRate: TARGET_SAMPLE_RATE,
        });
      }

      //samplingRatio - is only relevant for firefox, for Chromium based browsers, it's always 1
      samplingRatio = audioContext.sampleRate / TARGET_SAMPLE_RATE;
      console.log(
        `Debug AudioContext- sampleRate: ${audioContext.sampleRate} samplingRatio: ${samplingRatio}`
      );

      await audioPlayer.start();
      statusElement.textContent = "Microphone ready. Click Start to begin.";
      statusElement.className = "ready";
      startButton.disabled = false;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      statusElement.textContent = "Error: " + (error as Error).message;
      statusElement.className = "error";
    }
  }

  // Initialize the session with Bedrock
  async function initializeSession(): Promise<void> {
    if (sessionInitialized) return;
    statusElement.textContent = "Initializing session...";
    try {
      // Send events in sequence
      socket.emit("promptStart");
      socket.emit("systemPrompt", SYSTEM_PROMPT);
      socket.emit("audioStart");
      // Mark session as initialized
      sessionInitialized = true;
      statusElement.textContent = "Session initialized successfully";
    } catch (error) {
      console.error("Failed to initialize session:", error);
      statusElement.textContent = "Error initializing session";
      statusElement.className = "error";
    }
  }

  async function startStreaming(): Promise<void> {
    if (isStreaming) return;
    try {
      // First, make sure the session is initialized
      if (!sessionInitialized) {
        await initializeSession();
      }

      // Create audio processor
      sourceNode = audioContext.createMediaStreamSource(audioStream);

      // Use ScriptProcessorNode for audio processing
      if (audioContext.createScriptProcessor) {
        processor = audioContext.createScriptProcessor(512, 1, 1);
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!isStreaming) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const numSamples = Math.round(inputData.length / samplingRatio);
          const pcmData = isFirefox
            ? new Int16Array(numSamples)
            : new Int16Array(inputData.length);

          // Convert to 16-bit PCM
          if (isFirefox) {
            for (let i = 0; i < numSamples; i++) {
              pcmData[i] =
                Math.max(-1, Math.min(1, inputData[i * samplingRatio])) *
                0x7fff;
            }
          } else {
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
            }
          }

          // Convert to base64 (browser-safe way)
          const base64Data = arrayBufferToBase64(pcmData.buffer);
          // Send to server
          socket.emit("audioInput", base64Data);
        };
        sourceNode.connect(processor);
        processor.connect(audioContext.destination);
      }

      isStreaming = true;
      startButton.disabled = true;
      stopButton.disabled = false;
      statusElement.textContent = "Streaming... Speak now";
      statusElement.className = "recording";

      // Show user thinking indicator when starting to record
      transcriptionReceived = false;
      showUserThinkingIndicator();
    } catch (error) {
      console.error("Error starting recording:", error);
      statusElement.textContent = "Error: " + (error as Error).message;
      statusElement.className = "error";
    }
  }

  // Convert ArrayBuffer to base64 string
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary: string[] = [];
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary.push(String.fromCharCode(bytes[i]));
    }
    return btoa(binary.join(""));
  }

  function stopStreaming(): void {
    if (!isStreaming) return;
    isStreaming = false;

    // Clean up audio processing
    if (processor) {
      processor.disconnect();
      sourceNode.disconnect();
    }

    startButton.disabled = false;
    stopButton.disabled = true;
    statusElement.textContent = "Processing...";
    statusElement.className = "processing";
    audioPlayer.stop();

    // Tell server to finalize processing
    socket.emit("stopAudio");

    // End the current turn in chat history
    chatHistoryManager.endTurn();
  }

  // Base64 to Float32Array conversion
  function base64ToFloat32Array(base64String: string): Float32Array {
    try {
      const binaryString = window.atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      return float32Array;
    } catch (error) {
      console.error("Error in base64ToFloat32Array:", error);
      throw error;
    }
  }

  // Process message data and add to chat history
  function handleTextOutput(data: { role: string; content: string }): void {
    console.log("Processing text output:", data);
    if (data.content) {
      const messageData = {
        role: data.role,
        message: data.content,
      };
      chatHistoryManager.addTextMessage(messageData);
    }
  }

  // Update the UI based on the current chat history
  function updateChatUI(): void {
    if (!chatContainer) {
      console.error("Chat container not found");
      return;
    }

    // Clear existing chat messages
    chatContainer.innerHTML = "";

    // Add all messages from history
    chat.history.forEach((item) => {
      if (item.endOfConversation) {
        const endDiv = document.createElement("div");
        endDiv.className = "message system";
        endDiv.textContent = "Conversation ended";
        chatContainer.appendChild(endDiv);
        return;
      }

      if (item.role) {
        const messageDiv = document.createElement("div");
        const roleLowerCase = item.role.toLowerCase();
        messageDiv.className = `message ${roleLowerCase}`;

        const roleLabel = document.createElement("div");
        roleLabel.className = "role-label";
        roleLabel.textContent = item.role;
        messageDiv.appendChild(roleLabel);

        const content = document.createElement("div");
        content.textContent = item.message || "No content";
        messageDiv.appendChild(content);

        chatContainer.appendChild(messageDiv);
      }
    });

    // Re-add thinking indicators if we're still waiting
    if (waitingForUserTranscription) {
      showUserThinkingIndicator();
    }
    if (waitingForAssistantResponse) {
      showAssistantThinkingIndicator();
    }

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Show the "Listening" indicator for user
  function showUserThinkingIndicator(): void {
    hideUserThinkingIndicator();
    waitingForUserTranscription = true;
    userThinkingIndicator = document.createElement("div");
    userThinkingIndicator.className = "message user thinking";

    const roleLabel = document.createElement("div");
    roleLabel.className = "role-label";
    roleLabel.textContent = "USER";
    userThinkingIndicator.appendChild(roleLabel);

    const listeningText = document.createElement("div");
    listeningText.className = "thinking-text";
    listeningText.textContent = "Listening";
    userThinkingIndicator.appendChild(listeningText);

    const dotContainer = document.createElement("div");
    dotContainer.className = "thinking-dots";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dotContainer.appendChild(dot);
    }
    userThinkingIndicator.appendChild(dotContainer);

    chatContainer.appendChild(userThinkingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Show the "Thinking" indicator for assistant
  function showAssistantThinkingIndicator(): void {
    hideAssistantThinkingIndicator();
    waitingForAssistantResponse = true;
    assistantThinkingIndicator = document.createElement("div");
    assistantThinkingIndicator.className = "message assistant thinking";

    const roleLabel = document.createElement("div");
    roleLabel.className = "role-label";
    roleLabel.textContent = "ASSISTANT";
    assistantThinkingIndicator.appendChild(roleLabel);

    const thinkingText = document.createElement("div");
    thinkingText.className = "thinking-text";
    thinkingText.textContent = "Thinking";
    assistantThinkingIndicator.appendChild(thinkingText);

    const dotContainer = document.createElement("div");
    dotContainer.className = "thinking-dots";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dotContainer.appendChild(dot);
    }
    assistantThinkingIndicator.appendChild(dotContainer);

    chatContainer.appendChild(assistantThinkingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Hide the user thinking indicator
  function hideUserThinkingIndicator(): void {
    waitingForUserTranscription = false;
    if (userThinkingIndicator && userThinkingIndicator.parentNode) {
      userThinkingIndicator.parentNode.removeChild(userThinkingIndicator);
    }
    userThinkingIndicator = null;
  }

  // Hide the assistant thinking indicator
  function hideAssistantThinkingIndicator(): void {
    waitingForAssistantResponse = false;
    if (assistantThinkingIndicator && assistantThinkingIndicator.parentNode) {
      assistantThinkingIndicator.parentNode.removeChild(
        assistantThinkingIndicator
      );
    }
    assistantThinkingIndicator = null;
  }

  // Setup socket event handlers
  function setupSocketHandlers(): void {
    // Handle content start from the server
    socket.on("contentStart", (data: ContentStartData) => {
      console.log("Content start received:", data);
      if (data.type === "TEXT") {
        // Below update will be enabled when role is moved to the contentStart
        role = data.role;
        if (data.role === "USER") {
          // When user's text content starts, hide user thinking indicator
          hideUserThinkingIndicator();
        } else if (data.role === "ASSISTANT") {
          // When assistant's text content starts, hide assistant thinking indicator
          hideAssistantThinkingIndicator();
          let isSpeculative = false;
          try {
            if (data.additionalModelFields) {
              const additionalFields = JSON.parse(data.additionalModelFields);
              isSpeculative =
                additionalFields.generationStage === "SPECULATIVE";
              if (isSpeculative) {
                console.log("Received speculative content");
                displayAssistantText = true;
              } else {
                displayAssistantText = false;
              }
            }
          } catch (e) {
            console.error("Error parsing additionalModelFields:", e);
          }
        }
      } else if (data.type === "AUDIO") {
        // When audio content starts, we may need to show user thinking indicator
        if (isStreaming) {
          showUserThinkingIndicator();
        }
      }
    });

    // Handle text output from the server
    socket.on("textOutput", (data: TextOutputData) => {
      console.log("Received text output:", data);
      if (role === "USER") {
        // When user text is received, show thinking indicator for assistant response
        transcriptionReceived = true;
        // Add user message to chat
        handleTextOutput({
          role: data.role,
          content: data.content,
        });
        // Show assistant thinking indicator after user text appears
        showAssistantThinkingIndicator();
      } else if (role === "ASSISTANT") {
        if (displayAssistantText) {
          handleTextOutput({
            role: data.role,
            content: data.content,
          });
        }
      }
    });

    // Handle audio output
    socket.on("audioOutput", (data: AudioOutputData) => {
      if (data.content) {
        try {
          const audioData = base64ToFloat32Array(data.content);
          audioPlayer.playAudio(audioData);
        } catch (error) {
          console.error("Error processing audio data:", error);
        }
      }
    });

    // Handle content end events
    socket.on("contentEnd", (data: ContentEndData) => {
      console.log("Content end received:", data);
      if (data.type === "TEXT") {
        if (role === "USER") {
          // When user's text content ends, make sure assistant thinking is shown
          hideUserThinkingIndicator();
          showAssistantThinkingIndicator();
        } else if (role === "ASSISTANT") {
          // When assistant's text content ends, prepare for user input in next turn
          hideAssistantThinkingIndicator();
        }
        // Handle stop reasons
        if (data.stopReason && data.stopReason.toUpperCase() === "END_TURN") {
          chatHistoryManager.endTurn();
        } else if (
          data.stopReason &&
          data.stopReason.toUpperCase() === "INTERRUPTED"
        ) {
          console.log("Interrupted by user");
          audioPlayer.bargeIn();
        }
      } else if (data.type === "AUDIO") {
        // When audio content ends, we may need to show user thinking indicator
        if (isStreaming) {
          showUserThinkingIndicator();
        }
      }
    });

    // Stream completion event
    socket.on("streamComplete", () => {
      if (isStreaming) {
        stopStreaming();
      }
      statusElement.textContent = "Ready";
      statusElement.className = "ready";
    });

    // Handle connection status updates
    socket.on("connect", () => {
      statusElement.textContent = "Connected to server";
      statusElement.className = "connected";
      sessionInitialized = false;
    });

    socket.on("disconnect", () => {
      statusElement.textContent = "Disconnected from server";
      statusElement.className = "disconnected";
      startButton.disabled = true;
      stopButton.disabled = true;
      sessionInitialized = false;
      hideUserThinkingIndicator();
      hideAssistantThinkingIndicator();
    });

    // Handle errors
    socket.on("error", (error: any) => {
      console.error("Server error:", error);
      statusElement.textContent =
        "Error: " + (error.message || JSON.stringify(error).substring(0, 100));
      statusElement.className = "error";
      hideUserThinkingIndicator();
      hideAssistantThinkingIndicator();
    });
  }
</script>

<div
  class="max-w-4xl mx-auto px-4 py-8 flex flex-col justify-center min-h-screen"
>
  <div class="mb-4">
    <div
      bind:this={statusElement}
      id="status"
      class="text-center py-2 px-4 rounded-md bg-gray-700 text-white mb-4"
      style="color: white;"
    >
      Disconnected
    </div>
  </div>

  <div
    bind:this={chatContainer}
    id="chat-container"
    class="bg-gray-800 shadow-md rounded-lg p-4 mb-4 h-96 overflow-y-auto border border-gray-600"
  ></div>

  <div class="flex justify-center space-x-4">
    <button
      bind:this={startButton}
      id="start"
      class="px-6 py-3 bg-[#d600d6] hover:bg-[#c000c0] rounded-lg font-medium transition-all duration-300 text-white shadow-[0_0_10px_rgba(214,0,214,0.5)] hover:shadow-[0_0_15px_rgba(214,0,214,0.8)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={startStreaming}
    >
      Start Streaming
    </button>

    <button
      bind:this={stopButton}
      id="stop"
      class="px-6 py-3 bg-[#6d4dff] hover:bg-[#5a3dd9] rounded-lg font-medium transition-all duration-300 text-white shadow-[0_0_10px_rgba(109,77,255,0.5)] hover:shadow-[0_0_15px_rgba(109,77,255,0.8)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
      disabled
      on:click={stopStreaming}
    >
      Stop Streaming
    </button>
  </div>
</div>

<style>
  /* Add any additional custom styles if needed */
  :global(.message) {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
  }

  :global(.user) {
    background-color: #374151; /* darker gray for user messages */
    margin-left: 1rem;
    margin-right: 2rem;
    color: white;
  }

  :global(.assistant) {
    background-color: #1e40af; /* darker blue for assistant */
    margin-left: 2rem;
    margin-right: 1rem;
    color: white;
  }

  :global(.role-label) {
    font-weight: bold;
    margin-bottom: 0.25rem;
    color: #d1d5db; /* light gray for labels */
  }

  :global(.thinking) {
    opacity: 0.7;
  }

  :global(.thinking-dots) {
    display: inline-block;
  }

  :global(.dot) {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: #d1d5db;
    margin-right: 0.25rem;
    animation: pulse 1.5s infinite ease-in-out;
  }

  :global(.dot:nth-child(2)) {
    animation-delay: 0.2s;
  }

  :global(.dot:nth-child(3)) {
    animation-delay: 0.4s;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
</style>
