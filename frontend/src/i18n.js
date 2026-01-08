// src/i18n.js - Version corrigée et fonctionnelle
import i18n from 'i18next'; // ← Import correct depuis node_modules
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Configuration i18next
i18n
    .use(LanguageDetector) // Détecte la langue du navigateur ou localStorage
    .use(initReactI18next) // Intégration avec React
    .init({
        resources: {
            fr: {
                translation: {
                    intelligent_management: "Gestion intelligente",
                    future_task_management: "Le futur de la gestion des tâches à portée de main !",
                    sign_in: "Se connecter",
                    our_solutions: "Nos solutions",
                    contact_us: "Nous contacter",
                    solutions_morocco: "Nos solutions à travers le Maroc",
                    moroccan_platform_desc: "IntelliTask est une plateforme intelligente conçue pour les institutions marocaines.",
                    deployed_cities_desc: "Déployée dans les principales villes du Royaume, notre solution offre une gestion optimisée des tâches, assignation automatique par IA, notifications en temps réel et historique complet.",
                    users_trust: "Plus de 100 utilisateurs nous font confiance.",
                    deployment_morocco: "Déploiement au Maroc",
                    morocco_map: "Carte complète du Maroc - IntelliTask",
                    deployed_north_south: "IntelliTask est déployé dans tout le Royaume, du Nord au Sud.",
                    contact: "CONTACT",
                    careers: "CARRIÈRES",
                    join_team: "Rejoignez une équipe innovante",
                    welcome_dev_design: "Développeurs, designers, passionnés bienvenus",
                    follow_us: "SUIVEZ-NOUS",
                    full_name: "Nom complet",
                    name_placeholder: "Ex: Ahmed Benali",
                    specialty: "Spécialité",
                    grade: "Grade",
                    choose: "Choisir",
                    computer_science: "Informatique",
                    pedagogy: "Pédagogique",
                    planning: "Planification",
                    finance: "Financiers",
                    orientation: "Orientation",
                    email: "Email",
                    email_placeholder: "exemple@intellitask.com",
                    password: "Mot de passe",
                    password_placeholder: "Minimum 6 caractères",
                    create_account: "Créer mon compte",
                    no_account: "Pas de compte ? S'inscrire ici",
                    already_account: "Déjà inscrit ? Se connecter",
                    email_password_required: "Email et mot de passe obligatoires",
                    name_required: "Nom obligatoire pour l'inscription",
                    login_success: "Connexion réussie ! Bienvenue !",
                    registration_success: "Inscription réussie !",
                    connection_error: "Erreur de connexion",
                }
            },
            en: {
                translation: {
                    intelligent_management: "Intelligent Management",
                    future_task_management: "The future of task management at your fingertips!",
                    sign_in: "Sign In",
                    our_solutions: "Our Solutions",
                    contact_us: "Contact Us",
                    solutions_morocco: "Our Solutions Across Morocco",
                    moroccan_platform_desc: "IntelliTask is an intelligent platform designed for Moroccan institutions.",
                    deployed_cities_desc: "Deployed in major cities of the Kingdom, our solution offers optimized task management, AI-powered assignment, real-time notifications, and complete history.",
                    users_trust: "Over 100 users trust us.",
                    deployment_morocco: "Deployment in Morocco",
                    morocco_map: "Complete Map of Morocco - IntelliTask",
                    deployed_north_south: "IntelliTask is deployed throughout the Kingdom, from North to South.",
                    contact: "CONTACT",
                    careers: "CAREERS",
                    join_team: "Join an innovative team",
                    welcome_dev_design: "Developers, designers, passionate people welcome",
                    follow_us: "FOLLOW US",
                    full_name: "Full Name",
                    name_placeholder: "Ex: Ahmed Benali",
                    specialty: "Specialty",
                    grade: "Grade",
                    choose: "Choose",
                    computer_science: "Computer Science",
                    pedagogy: "Pedagogy",
                    planning: "Planning",
                    finance: "Finance",
                    orientation: "Guidance",
                    email: "Email",
                    email_placeholder: "example@intellitask.com",
                    password: "Password",
                    password_placeholder: "Minimum 6 characters",
                    create_account: "Create Account",
                    no_account: "No account? Sign Up",
                    already_account: "Already have an account? Sign In",
                    email_password_required: "Email and password are required",
                    name_required: "Name is required for registration",
                    login_success: "Login successful! Welcome!",
                    registration_success: "Registration successful!",
                    connection_error: "Connection error",
                }
            }
        },
        lng: 'fr', // Français par défaut
        fallbackLng: 'fr',
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        },
        interpolation: {
            escapeValue: false // React gère déjà l'échappement
        }
    });

export default i18n;