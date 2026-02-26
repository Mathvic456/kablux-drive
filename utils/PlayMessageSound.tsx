import { Audio } from 'expo-av';

let sound: Audio.Sound | null = null;

export const playMessageSound = async () => {
    try {
        const { sound: newSound } = await Audio.Sound.createAsync(
            require('../assets/sounds/kablux-sound.wav'),
            { shouldPlay: true }
        );

        sound = newSound;

        // Auto unload after playing
        newSound.setOnPlaybackStatusUpdate((status) => {
            if ('didJustFinish' in status && status.didJustFinish) {
                newSound.unloadAsync();
            }
        });

    } catch (error) {
        console.log("Error playing sound:", error);
    }
};