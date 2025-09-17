<script lang="ts">
  import { onMount } from 'svelte';
  import NpcCard from "../../components/NpcCard.svelte";
  import { goto } from "$app/navigation";
  import { page } from '$app/stores';

  // Define interface for NPC data structure
  interface NPC {
    GameId: string;
    Name: string;
    Description: string;
    Backstory: string;
    ExampleSpeech: string;
    Gender: string;
    Accent: string;
    Information: string;
    APIEvalPoint: string;
    ImagePath: string; // This will be an S3 bucket path
    Id: string;
  }
  
  // State for NPCs data and loading
  let npcList: NPC[] = [];
  let isLoading = true;
  let error: string | null = null;
  $: gameId = $page.url.searchParams.get('gameId') || null;

  // Fetch NPCs from API
  async function fetchNPCs(gameIdParam: string | null) {
    try {
      isLoading = true;
      error = null;
      
      // Build the URL with gameId parameter if available
      const url = gameIdParam 
        ? `/npcs?gameId=${encodeURIComponent(gameIdParam)}` 
        : '/npcs';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      npcList = data.items || [];
      
      console.log(`Loaded ${npcList.length} NPCs${gameIdParam ? ` for game ${gameIdParam}` : ''}`);
      
    } catch (err) {
      console.error("Failed to fetch NPCs:", err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      npcList = [];
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchNPCs(gameId);
  });
  
  // Function to handle S3 image paths
  function getImageUrl(path: string) {
    if (!path) return '/placeholder-npc.png';
    
    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Handle the case where it's just the S3 key (without the bucket URL prefix)
    // Example: "/npc/image123.jpg" -> "https://your-bucket.s3.region.amazonaws.com/npc/image123.jpg"
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Construct full S3 URL (update with your actual S3 bucket URL)
    return `https://npcforge-images.s3.amazonaws.com/${cleanPath}`;
  }
  
  const navigateToCreate = () => {
    goto("/npcs/create?gameId="+gameId);
  };
</script>

<div class="flex flex-row flex-wrap justify-center items-start gap-8 py-8 px-4 pt-[20vh]">
  <!-- Create NPC button -->
  <button
    on:click={navigateToCreate}
    class="fixed bottom-8 right-8 bg-[#d600d6] hover:bg-[#e100e1] text-white py-3 px-8 rounded-lg font-semibold shadow-[0_0_15px_rgba(255,0,255,0.7)] hover:shadow-[0_0_20px_rgba(255,0,255,0.9)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
  >
    <span class="mr-2">Create NPC</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
  
  <!-- Loading state -->
  {#if isLoading}
    <div class="w-full flex justify-center items-center py-16">
      <div class="animate-pulse flex flex-col items-center">
        <div class="w-16 h-16 border-4 border-t-[#d600d6] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-white text-lg">Loading NPCs...</p>
      </div>
    </div>
  <!-- Error state -->
  {:else if error}
    <div class="w-full text-center py-16">
      <p class="text-red-500 text-lg">Error loading NPCs: {error}</p>
      <button 
        class="mt-4 px-4 py-2 bg-[#6d4dff] rounded-lg text-white"
        on:click={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  <!-- Empty state -->
  {:else if npcList.length === 0}
    <div class="w-full text-center py-16">
      <p class="text-white text-lg">No NPCs found. Create your first character!</p>
    </div>
  <!-- Content state - display NPCs -->
{:else}
  {#each npcList as npc (npc.Name)}
      <NpcCard
        image={getImageUrl(npc.ImagePath)}
        name={npc.Name}
        description={npc.Description}
        dateCreated={new Date().toISOString().split('T')[0]} 
        genre={npc.Accent || "Fantasy"}
        chatLink="/chat?npcId={encodeURIComponent(npc.Id)}"
        npcId={npc.Id}
        textToCopy={`using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using NativeWebSocket;

public class NPCInteractionTrigger : MonoBehaviour
{
    [Header("Socket.IO Configuration")]
    [SerializeField] private string serverUrl = "https://express-npcforge.cloud303.tech";

    [Header("Audio Configuration")]
    [SerializeField] private int sampleRate = 16000;
    [SerializeField] private string microphoneDeviceName = null; // null = default device
    [SerializeField] private float audioBufferSize = 0.1f; // seconds

    private string npcId = ${npc.Id};
    [SerializeField] private AudioSource npcAudioSource;

    // WebSocket connection
    private WebSocket websocket;
    private bool isConnected = false;
    private bool isStreaming = false;

    // Audio recording
    private AudioClip microphoneClip;
    private float[] audioSamples;
    private int position = 0;
    private int lastPosition = 0;
    private bool sessionInitialized = false;

    // Player detection
    private bool playerInRange = false;

    private void Start()
    {
        // Make sure we have an audio source for the NPC
        if (npcAudioSource == null)
        {
            npcAudioSource = gameObject.AddComponent<AudioSource>();
        }

        // Check for microphone permissions at startup
        CheckMicrophonePermission();

        // Connect to WebSocket server
        ConnectToServer();
    }

    private void ConnectToServer()
    {
        _ = ConnectToServerAsync();
    }

    private async Task ConnectToServerAsync()
    {
        // Connect to WebSocket server
        websocket = new WebSocket(serverUrl);

        websocket.OnOpen += () => {
            Debug.Log("WebSocket connection opened");
            isConnected = true;
        };

        websocket.OnError += (e) => {
            Debug.LogError($"WebSocket Error: {e}");
        };

        websocket.OnClose += (e) => {
            Debug.Log($"WebSocket connection closed with code: {e}");
            isConnected = false;
            sessionInitialized = false;
        };

        websocket.OnMessage += HandleMessage;

        // Connect to the server
        await websocket.Connect();
    }

    private void HandleMessage(byte[] message)
    {
        string msg = Encoding.UTF8.GetString(message);

        // Parse the JSON message
        if (msg.Contains("audioOutput"))
        {
            // Process incoming audio
            HandleAudioOutput(msg);
        }
    }

    private void HandleAudioOutput(string jsonMessage)
    {
        // Parse the message to extract base64 audio content
        // This is a simple example, you may need to use a proper JSON parser
        int startIndex = jsonMessage.IndexOf("\"content\":\"") + "\"content\":\"".Length;
        int endIndex = jsonMessage.IndexOf("\"}", startIndex);

        if (startIndex >= 0 && endIndex > startIndex)
        {
            string base64Audio = jsonMessage.Substring(startIndex, endIndex - startIndex);
            PlayAudioFromBase64(base64Audio);
        }
    }

    private void PlayAudioFromBase64(string base64Audio)
    {
        try
        {
            // Convert base64 to audio data
            byte[] bytes = Convert.FromBase64String(base64Audio);

            // Convert to float array (assuming 16-bit PCM as in your original code)
            int sampleCount = bytes.Length / 2;
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                short sample = (short)((bytes[i * 2 + 1] << 8) | bytes[i * 2]);
                samples[i] = sample / 32768.0f;
            }

            // Play the audio
            AudioClip clip = AudioClip.Create("NPCAudio", samples.Length, 1, sampleRate, false);
            clip.SetData(samples, 0);

            npcAudioSource.clip = clip;
            npcAudioSource.Play();
        }
        catch (Exception e)
        {
            Debug.LogError($"Error playing audio: {e.Message}");
        }
    }

    private void Update()
    {
        // Process WebSocket messages
#if !UNITY_WEBGL || UNITY_EDITOR
        websocket?.DispatchMessageQueue();
#endif

        // Process microphone input only if we're streaming
        if (isStreaming && Microphone.IsRecording(microphoneDeviceName))
        {
            ProcessMicrophoneInput();
        }
    }

    private void OnDestroy()
    {
        // Clean up when object is destroyed
        StopStreaming();
        CloseConnection();
    }

    private void OnDisable()
    {
        StopStreaming();
    }

    private void CloseConnection()
    {
        _ = CloseConnectionAsync();
    }

    private async Task CloseConnectionAsync()
    {
        if (websocket != null && isConnected)
        {
            await websocket.Close();
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        // Check if the player entered the trigger
        if (other.CompareTag("Player"))
        {
            playerInRange = true;
            StartStreaming();
        }
    }

    private void OnTriggerExit(Collider other)
    {
        // Check if the player left the trigger
        if (other.CompareTag("Player"))
        {
            playerInRange = false;
            StopStreaming();
        }
    }

    private void InitializeSession()
    {
        _ = InitializeSessionAsync();
    }

    private async Task InitializeSessionAsync()
    {
        if (sessionInitialized) return;

        try
        {
            // Prepare the prompt with NPC data
            string promptMessage = FetchNPCData(npcId);

            // Send events in sequence
            await SendWebSocketMessageAsync("promptStart");
            await SendWebSocketMessageAsync("systemPrompt", promptMessage);
            await SendWebSocketMessageAsync("audioStart");

            sessionInitialized = true;
            Debug.Log("Session initialized successfully");
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to initialize session: {e.Message}");
        }
    }

    private void StartStreaming()
    {
        if (isStreaming) return;

        if (!isConnected)
        {
            Debug.LogWarning("Cannot start streaming: Not connected to server");
            ConnectToServer();
            return;
        }

        // Initialize the session if needed
        if (!sessionInitialized)
        {
            InitializeSession();
        }

        // Start recording from the microphone
        Debug.Log("Starting microphone recording");
        microphoneClip = Microphone.Start(microphoneDeviceName, true, 10, sampleRate);

        // Allocate buffer for audio samples
        int bufferLength = Mathf.RoundToInt(sampleRate * audioBufferSize);
        audioSamples = new float[bufferLength];

        isStreaming = true;
        Debug.Log("Audio streaming started");
    }

    private void StopStreaming()
    {
        _ = StopStreamingAsync();
    }

    private async Task StopStreamingAsync()
    {
        if (!isStreaming) return;

        isStreaming = false;

        // Stop microphone recording
        if (Microphone.IsRecording(microphoneDeviceName))
        {
            Microphone.End(microphoneDeviceName);
        }

        // Tell server to finalize processing
        await SendWebSocketMessageAsync("stopAudio");

        Debug.Log("Audio streaming stopped");
    }

    private void ProcessMicrophoneInput()
    {
        if (microphoneClip == null) return;

        // Get the current position in the micro buffer
        position = Microphone.GetPosition(microphoneDeviceName);

        // If we have new data to read
        if (position != lastPosition)
        {
            int sampleCount;

            // Handle position wraparound
            if (position < lastPosition)
            {
                sampleCount = (microphoneClip.samples - lastPosition) + position;
            }
            else
            {
                sampleCount = position - lastPosition;
            }

            if (sampleCount > 0 && sampleCount <= audioSamples.Length)
            {
                // Get audio samples
                microphoneClip.GetData(audioSamples, 0);

                // Convert to 16-bit PCM
                byte[] pcmData = new byte[sampleCount * 2]; // 2 bytes per sample (16-bit)
                for (int i = 0; i < sampleCount; i++)
                {
                    short sample = (short)(audioSamples[i] * 32767.0f);
                    pcmData[i * 2] = (byte)(sample & 0xFF);
                    pcmData[i * 2 + 1] = (byte)((sample >> 8) & 0xFF);
                }

                // Convert to base64
                string base64Data = Convert.ToBase64String(pcmData);

                // Send audio data to server
                SendWebSocketMessage("audioInput", base64Data);
            }

            lastPosition = position;
        }
    }

    private string FetchNPCData(string npcId)
    {

        string promptSetup = "You are a character in a video game. Do not ever admit that you are AI. " +
                          "Do not ask the player what they need help with, or if you can be of assistance. " +
                          "The following information is the role in the video game that you are about to assume. " +
                          "You will also receive a summary of your past interactions with the player. " +
                          "Be sure to factor that information into this interaction with the character.";

        // UnityWebRequest www = UnityWebRequest.Get($"https://npcforge.cloud303.tech/update/chat?npcId=${npc.Id}");
        www.SendWebRequest();
        string npcData = www.downloadHandler.text;

    }

    private void CheckMicrophonePermission()
    {
#if UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
        {
            Permission.RequestUserPermission(Permission.Microphone);
        }
#endif
    }

    private void SendWebSocketMessage(string eventName, string data = null)
    {
        _ = SendWebSocketMessageAsync(eventName, data);
    }

    private async Task SendWebSocketMessageAsync(string eventName, string data = null)
    {
        if (!isConnected || websocket == null)
        {
            Debug.LogWarning("Cannot send message: Not connected to server");
            return;
        }

        try
        {
            string message;
            if (data != null)
            {
                message = $"{{\"event\":\"{eventName}\",\"data\":\"{data}\"}}";
            }
            else
            {
                message = $"{{\"event\":\"{eventName}\"}}";
            }

            await websocket.SendText(message);
        }
        catch (Exception e)
        {
            Debug.LogError($"Error sending WebSocket message: {e.Message}");
        }
    }
}`}
      />
  {/each}
{/if}
</div>