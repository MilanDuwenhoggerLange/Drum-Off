// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    // Select all necessary elements from the HTML structure
    const drumSounds = {
        kick: document.getElementById('kick-sound'),
        ride: document.getElementById('ride-sound'),
        snare: document.getElementById('snare-sound'),
        tom: document.getElementById('tom-sound'),
        hihat: document.getElementById('hihat-sound'),
        clap: document.getElementById('clap-sound'),
        openhat: document.getElementById('openhat-sound'),
        tink: document.getElementById('tink-sound'),
        boom: document.getElementById('boom-sound')
    };

    const drumButtons = {
        kick: document.getElementById('kick'),
        ride: document.getElementById('ride'),
        snare: document.getElementById('snare'),
        tom: document.getElementById('tom'),
        hihat: document.getElementById('hihat'),
        clap: document.getElementById('clap'),
        openhat: document.getElementById('openhat'),
        tink: document.getElementById('tink'),
        boom: document.getElementById('boom')
    };

    const volumeControl = document.getElementById('volume');
    const sequencerContainer = document.getElementById('sequencer');
    const playButton = document.getElementById('playButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const playRecordingButton = document.getElementById('playRecordingButton');

    // --- State Variables ---
    // Variables to keep track of application state
    let isSequencerPlaying = false; // Is the sequencer currently playing?
    let currentBeat = 0;            // Which beat the sequencer is currently on
    let sequencerIntervalId = null; // ID for the sequencer's setInterval timer
    const beatsPerSequence = 8;     // Number of beats in the sequencer grid
    const sequencerTempo = 250;     // Time between sequencer beats in ms (250ms = 120 BPM)

    let isRecording = false;        // Is audio recording currently active?
    let recordingStartTime = 0;     // Timestamp when recording started
    let recordedActions = [];       // Array to store recorded sound events { sound, time }


    // --- Core Functions ---

    /**
     * Plays a specified drum sound audio element.
     * Resets playback position and plays the sound.
     * If recording is active, logs the sound event.
     * @param {HTMLAudioElement} sound - The audio element to play.
     * @param {string} soundKey - The key name of the sound (e.g., 'kick').
     */
    function playSound(sound, soundKey) {
        if (!sound) {
            console.error(`Sound element for key "${soundKey}" not found.`);
            return;
        }
        sound.currentTime = 0; // Reset audio to the beginning for re-triggering
        sound.play();

        // If currently recording, add this action to the recordedActions array
        if (isRecording) {
            recordedActions.push({
                sound: soundKey,
                time: Date.now() - recordingStartTime // Store time relative to recording start
            });
        }
    }

    /**
     * Adds a temporary visual feedback class ('playing') to an element.
     * @param {HTMLElement} element - The DOM element to apply the class to.
     */
    function addPlayingClass(element) {
        if (!element) return;
        element.classList.add('playing');
        // Remove the class after a short delay (100ms)
        setTimeout(() => {
            element.classList.remove('playing');
        }, 100);
    }

    /**
     * Generates the sequencer grid dynamically within the sequencerContainer.
     */
    function createSequencerGrid() {
        const instruments = Object.keys(drumSounds); // Get names of all instruments

        instruments.forEach(instrument => {
            const row = document.createElement('div');
            row.className = 'sequencer-row'; // Assign class for styling

            for (let i = 0; i < beatsPerSequence; i++) {
                const beatButton = document.createElement('button');
                beatButton.className = 'sequencer-beat'; // Assign class for styling
                beatButton.dataset.instrument = instrument; // Store instrument name
                beatButton.dataset.beat = i;             // Store beat index
                row.appendChild(beatButton);             // Add beat button to the row
            }
            sequencerContainer.appendChild(row); // Add the completed row to the grid
        });
    }

    /**
     * Plays the sounds scheduled for the current beat in the sequence.
     */
    function playSequenceBeat() {
        // Select all active beat buttons for the current beat column
        const activeBeatButtons = sequencerContainer.querySelectorAll(
            `.sequencer-beat[data-beat="${currentBeat}"].active`
        );

        // Trigger sound and visual feedback for each active beat
        activeBeatButtons.forEach(button => {
            const instrumentKey = button.dataset.instrument;
            playSound(drumSounds[instrumentKey], instrumentKey);
            addPlayingClass(drumButtons[instrumentKey]); // Also flash the main drum pad
        });

        // Move to the next beat, looping back to 0 if at the end
        currentBeat = (currentBeat + 1) % beatsPerSequence;
    }

    /**
     * Toggles the sequencer playback state (Play/Stop).
     */
    function toggleSequencer() {
        isSequencerPlaying = !isSequencerPlaying; // Flip the playing state

        if (isSequencerPlaying) {
            // Start Playing
            currentBeat = 0; // Reset beat count to the beginning
            playSequenceBeat(); // Play the first beat immediately
            // Set up interval timer to play subsequent beats
            sequencerIntervalId = setInterval(playSequenceBeat, sequencerTempo);
            playButton.textContent = 'Stop Sequence'; // Update button text
        } else {
            // Stop Playing
            clearInterval(sequencerIntervalId); // Clear the interval timer
            sequencerIntervalId = null;
            playButton.textContent = 'Play Sequence'; // Reset button text
        }
    }

    /**
     * Fetches instructions from a markdown file and displays them in a modal.
     */
    function showInstructions() {
        fetch('user_manual.md') // Attempt to fetch the instructions file
            .then(response => {
                if (!response.ok) { // Check if the fetch was successful
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text(); // Get the response body as text
            })
            .then(text => {
                // Create modal container
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.left = '0';
                modal.style.top = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.8)'; // Dark semi-transparent background
                modal.style.zIndex = '1000';                     // Ensure modal is on top
                modal.style.overflow = 'auto';                   // Allow scrolling if content overflows
                modal.style.padding = '5%';                      // Padding for content inside

                // Create content area within the modal
                const content = document.createElement('div');
                content.style.backgroundColor = '#f0f0f0';      // Light background for content
                content.style.margin = 'auto';                  // Center the content box
                content.style.padding = '30px';                 // Padding inside the content box
                content.style.width = '90%';                    // Responsive width
                content.style.maxWidth = '800px';               // Max width for readability
                content.style.borderRadius = '8px';             // Rounded corners
                content.style.color = '#1a1a1a';                // Dark text color for contrast
                content.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'; // Subtle shadow

                // Basic Markdown to HTML conversion (can be improved with a library)
                const html = text
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')       // H1
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')      // H2
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')     // H3
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>') // Bold
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')          // Italic
                    .replace(/^\* (.*$)/gim, '<li>$1</li>')         // List item (basic)
                    .replace(/`(.*?)`/gim, '<code>$1</code>')      // Inline code
                    .replace(/\n/gim, '<br>');                    // Line breaks

                content.innerHTML = `<h2>App Instructions</h2><hr>${html}`; // Add title and converted content

                // Create close button
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close';
                closeButton.style.marginTop = '20px';
                closeButton.style.padding = '10px 20px';
                closeButton.style.backgroundColor = '#00ffff';
                closeButton.style.color = '#000';
                closeButton.style.border = 'none';
                closeButton.style.borderRadius = '5px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.display = 'block'; // Make it a block element
                close.style.margin = '20px auto 0'; // Center the button

                // Close modal functionality
                closeButton.onclick = () => document.body.removeChild(modal);
                modal.onclick = (event) => { // Also close if clicking the background overlay
                    if (event.target === modal) {
                        document.body.removeChild(modal);
                    }
                };

                content.appendChild(closeButton); // Add close button to content
                modal.appendChild(content);       // Add content to modal
                document.body.appendChild(modal); // Add modal to the page
            })
            .catch(error => {
                console.error('Error fetching or displaying instructions:', error);
                alert('Could not load instructions. Please check if user_manual.md exists.');
            });
    }

    /**
     * Starts the recording process.
     */
    function startRecording() {
        isRecording = true;
        recordedActions = []; // Clear previous recording
        recordingStartTime = Date.now(); // Record the start time

        // Update button states and styles
        recordButton.disabled = true;
        recordButton.classList.add('recording'); // Add recording style
        stopButton.disabled = false;
        playRecordingButton.disabled = true;
        playRecordingButton.textContent = 'Play Recording'; // Reset text if needed
    }

    /**
     * Stops the recording process.
     */
    function stopRecording() {
        isRecording = false;

        // Update button states and styles
        recordButton.disabled = false;
        recordButton.classList.remove('recording'); // Remove recording style
        stopButton.disabled = true;
        // Enable play button only if something was recorded
        playRecordingButton.disabled = (recordedActions.length === 0);
    }

    /**
     * Plays back the recorded sequence of actions.
     */
    function playRecording() {
        if (recordedActions.length === 0) {
            console.log("Nothing recorded yet.");
            return; // Do nothing if no actions were recorded
        }

        console.log("Playing back recording...");
        // Disable controls during playback
        playRecordingButton.disabled = true;
        playRecordingButton.textContent = 'Playing...'; // Indicate playback
        recordButton.disabled = true;
        stopButton.disabled = true; // Should already be disabled

        // Keep track of timeouts to potentially cancel them if needed (though not implemented here)
        const playbackTimeouts = [];

        // Schedule each recorded sound event using setTimeout
        recordedActions.forEach(action => {
            const timeoutId = setTimeout(() => {
                playSound(drumSounds[action.sound], action.sound);
                addPlayingClass(drumButtons[action.sound]);
            }, action.time); // Schedule based on time offset from recording start
            playbackTimeouts.push(timeoutId);
        });

        // Determine when playback finishes (time of the last action + a small buffer)
        const lastActionTime = recordedActions.length > 0 ? recordedActions[recordedActions.length - 1].time : 0;
        const playbackDuration = lastActionTime + 500; // Add 500ms buffer

        // Re-enable buttons after the playback is complete
        setTimeout(() => {
            playRecordingButton.disabled = false;
            playRecordingButton.textContent = 'Play Recording';
            recordButton.disabled = false;
            // Stop button remains disabled until next recording starts
        }, playbackDuration);
    }


    // --- Event Listeners Setup ---

    // 1. Drum Pad Clicks
    Object.keys(drumButtons).forEach(key => {
        drumButtons[key].addEventListener('click', () => {
            playSound(drumSounds[key], key); // Play the corresponding sound
            addPlayingClass(drumButtons[key]); // Add visual feedback
        });
    });

    // 2. Keyboard Input for Drum Pads
    document.addEventListener('keydown', (event) => {
        // Ignore key presses if the user is typing in an input field (future-proofing)
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const key = event.key.toLowerCase(); // Get the pressed key (lowercase)
        // Map keyboard keys to drum sound keys
        const keyMap = {
            'q': 'kick', 'w': 'ride', 'e': 'snare', 'r': 'tom', 't': 'hihat',
            'y': 'clap', 'u': 'openhat', 'i': 'tink', 'o': 'boom'
        };

        const soundKey = keyMap[key]; // Find the sound key corresponding to the pressed keyboard key
        if (soundKey) { // If the pressed key is mapped to a sound
            playSound(drumSounds[soundKey], soundKey); // Play the sound
            addPlayingClass(drumButtons[soundKey]); // Add visual feedback
            event.preventDefault(); // Prevent default browser action for the key (e.g., scrolling)
        }
    });

    // 3. Volume Control
    volumeControl.addEventListener('input', (event) => {
        const volume = parseFloat(event.target.value); // Get volume value (0.0 to 1.0)
        // Apply the volume to all audio elements
        Object.values(drumSounds).forEach(sound => {
            if (sound) { // Check if sound element exists
               sound.volume = volume;
            }
        });
    });

    // 4. Sequencer Beat Toggling
    sequencerContainer.addEventListener('click', (event) => {
        // Check if the clicked element is a sequencer beat button
        if (event.target.classList.contains('sequencer-beat')) {
            event.target.classList.toggle('active'); // Toggle the 'active' class
        }
    });

    // 5. Sequencer Play/Stop Button
    playButton.addEventListener('click', toggleSequencer);

    // 6. Instructions Button
    instructionsButton.addEventListener('click', showInstructions);

    // 7. Recording Controls
    recordButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    playRecordingButton.addEventListener('click', playRecording);


    // --- Initialization ---
    // Code that runs once when the script loads

    createSequencerGrid(); // Generate the sequencer UI

    // Set initial volume for all sounds based on the slider's default value
    const initialVolume = parseFloat(volumeControl.value);
    Object.values(drumSounds).forEach(sound => {
        if (sound) {
             sound.volume = initialVolume;
        }
    });

    console.log("Drum Machine Initialized!");

}); // End of DOMContentLoaded listener