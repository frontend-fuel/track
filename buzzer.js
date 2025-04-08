// ThingSpeak API configuration
const THINGSPEAK_API_KEY = "GN2J04LOQ42F0VDD";
const THINGSPEAK_UPDATE_URL = "https://api.thingspeak.com/update";

// Function to update buzzer state
async function updateBuzzer(state) {
    const statusElement = document.getElementById("status");
    statusElement.textContent = "⏳ Sending request...";

    try {
        const url = `${THINGSPEAK_UPDATE_URL}?api_key=${THINGSPEAK_API_KEY}&field3=${state}`;
        const response = await fetch(url);
        const data = await response.text();

        if (parseInt(data) > 0) {
            if (state === 1) {
                statusElement.textContent = "✅ Buzzer turned ON. It will auto OFF after 20 seconds.";
                // Auto turn off after 30 seconds
                setTimeout(() => {
                    updateBuzzer(0);
                }, 16000);
            } else {
                statusElement.textContent = "🛑 Buzzer turned OFF.";
            }
        } else {
            statusElement.textContent = "⚠️ Update failed. Please try again.";
        }
    } catch (error) {
        console.error('Error updating buzzer:', error);
        statusElement.textContent = "❌ Connection error. Check your network.";
    }
}
