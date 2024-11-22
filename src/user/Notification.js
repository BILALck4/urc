import React, { useEffect, useState } from 'react';
import { Client, TokenProvider } from "@pusher/push-notifications-web";

console.log("Notifications component loaded");

const beamsClient = new Client({
    instanceId: '2382f17c-6b81-4d80-a56d-3e4f56018ecf',
});

const Notifications = ({ children }) => {
    const [permission, setPermission] = useState(""); // Suivre l'état de la permission

    // Fonction pour initialiser les notifications push
    const initializePushNotifications = async () => {
        const token = sessionStorage.getItem('token');
        const userExternalId = sessionStorage.getItem('externalId');

        if (!token || !userExternalId) {
            console.error('Token or External ID is missing!');
            return;
        }

        const notificationPermission = Notification.permission;
        if (notificationPermission !== "granted") {
            console.warn("Notifications permission not granted:", notificationPermission);
            setPermission(notificationPermission);
            return;
        }

        setPermission("granted");

        const beamsTokenProvider = new TokenProvider({
            url: "/api/beams",
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        try {
            const currentUserId = await beamsClient.getUserId().catch(() => null);

            if (currentUserId && currentUserId !== userExternalId) {
                console.log(`Stopping Beams for user: ${currentUserId}`);
                await beamsClient.stop();
            }

            if (!currentUserId) {
                console.log("Initializing Beams for user:", userExternalId);
                await beamsClient.start();
                await beamsClient.addDeviceInterest('global');
                await beamsClient.setUserId(userExternalId, beamsTokenProvider);
                console.log("Push notifications initialized for user:", userExternalId);
            } else {
                console.log(`Beams already initialized for user: ${currentUserId}`);
            }
        } catch (error) {
            console.error("Erreur d'initialisation des notifications push:", error);
        }
    };

    useEffect(() => {
        initializePushNotifications(); // Appeler la fonction dans useEffect
    }, []);

    const requestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        if (permission === "granted") {
            console.log("Notifications permission granted. Reinitializing...");
            initializePushNotifications(); // Appeler à nouveau après avoir accordé la permission
        } else {
            console.warn("Notifications permission denied or dismissed:", permission);
        }
    };

    return (
        <>
            {permission === "default" && (
                <button onClick={requestNotificationPermission}>
                    Activer les notifications
                </button>
            )}
            {permission === "denied" && (
                <p>Les notifications sont désactivées. Veuillez les activer dans vos paramètres de navigateur.</p>
            )}
            {children}
        </>
    );
};

export default Notifications;
