// Voice Authentication System with Advanced Audio Feature Analysis
class VoiceAuthSystem {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.recordedChunks = [];
        this.enrollmentData = null;
        this.waveformEnrollment = null;
        this.waveformAuth = null;
        this.featureChart = null;
        this.isRecording = false;
        
        // Audio analysis parameters
        this.sampleRate = 44100;
        this.frameSize = 512;
        this.hopSize = 256;
        
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        this.setupNavigation();
        this.setupWaveForms();
        this.setupEventListeners();
        this.loadEnrollmentData();
        this.checkEnrollmentStatus();
    }

    // Setup navigation between pages
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const ctaButton = document.querySelector('.cta-button');
        const pages = document.querySelectorAll('.page');

        // Navigation click handlers
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                this.showPage(targetPage);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // CTA button handler
        if (ctaButton) {
            ctaButton.addEventListener('click', () => {
                this.showPage('login');
                navLinks.forEach(l => l.classList.remove('active'));
                document.querySelector('[data-page="login"]').classList.add('active');
            });
        }
    }

    // Show specific page with animation
    showPage(pageId) {
        const pages = document.querySelectorAll('.page');
        const targetPage = document.getElementById(pageId);
        
        // Hide all pages
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page with slight delay for smooth transition
        setTimeout(() => {
            targetPage.classList.add('active');
        }, 150);
    }

    // Setup WaveSurfer.js instances
    setupWaveForms() {
        // Enrollment waveform
        this.waveformEnrollment = WaveSurfer.create({
            container: '#waveform-enrollment',
            waveColor: '#00D4FF',
            progressColor: '#B026FF',
            backgroundColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            height: 60,
            normalize: true,
            responsive: true
        });

        // Authentication waveform
        this.waveformAuth = WaveSurfer.create({
            container: '#waveform-auth',
            waveColor: '#00D4FF',
            progressColor: '#B026FF',
            backgroundColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            height: 60,
            normalize: true,
            responsive: true
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        // Recording buttons
        document.getElementById('record-enrollment').addEventListener('click', () => {
            this.handleEnrollmentRecording();
        });

        document.getElementById('record-auth').addEventListener('click', () => {
            this.handleAuthenticationRecording();
        });

        // Action buttons
        document.getElementById('save-enrollment').addEventListener('click', () => {
            this.saveEnrollment();
        });

        document.getElementById('reset-enrollment').addEventListener('click', () => {
            this.resetEnrollment();
        });

        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    // Load enrollment data from localStorage
    loadEnrollmentData() {
        const storedData = localStorage.getItem('voiceEnrollment');
        if (storedData) {
            try {
                this.enrollmentData = JSON.parse(storedData);
                console.log('Enrollment data loaded successfully');
            } catch (error) {
                console.error('Error loading enrollment data:', error);
                localStorage.removeItem('voiceEnrollment');
            }
        }
    }

    // Check if user has enrolled and show appropriate section
    checkEnrollmentStatus() {
        const enrollmentSection = document.getElementById('enrollment-section');
        const authenticationSection = document.getElementById('authentication-section');
        
        if (this.enrollmentData && this.enrollmentData.features) {
            enrollmentSection.style.display = 'none';
            authenticationSection.style.display = 'block';
        } else {
            enrollmentSection.style.display = 'block';
            authenticationSection.style.display = 'none';
        }
    }

    // Handle enrollment recording
    async handleEnrollmentRecording() {
        const button = document.getElementById('record-enrollment');
        const status = document.getElementById('recording-status');
        
        if (!this.isRecording) {
            try {
                await this.startRecording('enrollment');
                button.innerHTML = '<span class="record-icon">⏹️</span><span class="record-text">Stop Recording</span>';
                button.classList.add('recording');
                status.textContent = 'Recording... Please speak the phrase clearly';
                status.className = 'recording-status recording';
            } catch (error) {
                console.error('Error starting recording:', error);
                status.textContent = 'Error accessing microphone. Please check permissions.';
                status.className = 'recording-status';
            }
        } else {
            this.stopRecording();
            button.innerHTML = '<span class="record-icon">🎤</span><span class="record-text">Start Recording</span>';
            button.classList.remove('recording');
            status.textContent = 'Processing audio...';
            status.className = 'recording-status processing';
        }
    }

    // Handle authentication recording
    async handleAuthenticationRecording() {
        const button = document.getElementById('record-auth');
        const status = document.getElementById('auth-status');
        
        if (!this.isRecording) {
            try {
                await this.startRecording('authentication');
                button.innerHTML = '<span class="record-icon">⏹️</span><span class="record-text">Stop Recording</span>';
                button.classList.add('recording');
                status.textContent = 'Recording... Please speak the phrase clearly';
                status.className = 'recording-status recording';
            } catch (error) {
                console.error('Error starting recording:', error);
                status.textContent = 'Error accessing microphone. Please check permissions.';
                status.className = 'recording-status';
            }
        } else {
            this.stopRecording();
            button.innerHTML = '<span class="record-icon">🎤</span><span class="record-text">Authenticate</span>';
            button.classList.remove('recording');
            status.textContent = 'Processing and analyzing audio...';
            status.className = 'recording-status processing';
        }
    }

    // Start audio recording
    async startRecording(mode) {
        try {
            // Request microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: this.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.recordedChunks = [];
            this.isRecording = true;

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                this.processRecording(mode);
            };

            // Start recording
            this.mediaRecorder.start();

            // Auto-stop after 5 seconds
            setTimeout(() => {
                if (this.isRecording) {
                    if (mode === 'enrollment') {
                        document.getElementById('record-enrollment').click();
                    } else {
                        document.getElementById('record-auth').click();
                    }
                }
            }, 5000);

        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    // Stop audio recording
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }

        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
    }

    // Process recorded audio
    async processRecording(mode) {
        try {
            // Create audio blob
            const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Load into appropriate waveform
            if (mode === 'enrollment') {
                this.waveformEnrollment.load(audioUrl);
                this.waveformEnrollment.on('ready', () => {
                    this.extractAudioFeatures(audioBlob, mode);
                });
            } else {
                this.waveformAuth.load(audioUrl);
                this.waveformAuth.on('ready', () => {
                    this.extractAudioFeatures(audioBlob, mode);
                });
            }

        } catch (error) {
            console.error('Error processing recording:', error);
            this.updateStatus(mode, 'Error processing audio. Please try again.', '');
        }
    }

    // Extract audio features using Meyda.js
    async extractAudioFeatures(audioBlob, mode) {
        try {
            // Convert blob to ArrayBuffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            const audioData = audioBuffer.getChannelData(0);

            // Extract features using Meyda
            const features = this.extractMeydaFeatures(audioData);

            if (mode === 'enrollment') {
                this.currentEnrollmentFeatures = features;
                this.updateStatus('enrollment', 'Audio processed successfully! Click Save Voiceprint to complete enrollment.', 'ready');
                document.getElementById('save-enrollment').style.display = 'block';
            } else {
                this.authenticateVoice(features);
            }

        } catch (error) {
            console.error('Error extracting audio features:', error);
            this.updateStatus(mode, 'Error analyzing audio. Please try again.', '');
        }
    }

    // Extract features using Meyda.js
    extractMeydaFeatures(audioData) {
        const features = {
            mfcc: [],
            spectralCentroid: [],
            spectralRolloff: [],
            spectralFlatness: [],
            zcr: [],
            rms: [],
            chroma: []
        };

        // Process audio in frames
        const frameCount = Math.floor((audioData.length - this.frameSize) / this.hopSize) + 1;

        for (let i = 0; i < frameCount; i++) {
            const start = i * this.hopSize;
            const end = Math.min(start + this.frameSize, audioData.length);
            const frame = audioData.slice(start, end);

            // Pad frame if necessary
            if (frame.length < this.frameSize) {
                const paddedFrame = new Float32Array(this.frameSize);
                paddedFrame.set(frame);
                frame = paddedFrame;
            }

            // Extract features for this frame
            const frameFeatures = Meyda.extract([
                'mfcc', 'spectralCentroid', 'spectralRolloff', 
                'spectralFlatness', 'zcr', 'rms', 'chroma'
            ], frame);

            // Store features
            if (frameFeatures.mfcc) features.mfcc.push(frameFeatures.mfcc);
            if (frameFeatures.spectralCentroid) features.spectralCentroid.push(frameFeatures.spectralCentroid);
            if (frameFeatures.spectralRolloff) features.spectralRolloff.push(frameFeatures.spectralRolloff);
            if (frameFeatures.spectralFlatness) features.spectralFlatness.push(frameFeatures.spectralFlatness);
            if (frameFeatures.zcr) features.zcr.push(frameFeatures.zcr);
            if (frameFeatures.rms) features.rms.push(frameFeatures.rms);
            if (frameFeatures.chroma) features.chroma.push(frameFeatures.chroma);
        }

        // Calculate mean features
        return {
            mfcc: this.calculateMean(features.mfcc),
            spectralCentroid: this.calculateMean(features.spectralCentroid),
            spectralRolloff: this.calculateMean(features.spectralRolloff),
            spectralFlatness: this.calculateMean(features.spectralFlatness),
            zcr: this.calculateMean(features.zcr),
            rms: this.calculateMean(features.rms),
            chroma: this.calculateMean(features.chroma)
        };
    }

    // Calculate mean of feature arrays
    calculateMean(featureArray) {
        if (!featureArray || featureArray.length === 0) return [];
        
        if (Array.isArray(featureArray[0])) {
            // Handle multi-dimensional arrays (like MFCC)
            const dimensions = featureArray[0].length;
            const means = new Array(dimensions).fill(0);
            
            featureArray.forEach(frame => {
                frame.forEach((value, index) => {
                    means[index] += value / featureArray.length;
                });
            });
            
            return means;
        } else {
            // Handle single-dimensional arrays
            return featureArray.reduce((sum, value) => sum + value, 0) / featureArray.length;
        }
    }

    // Save enrollment data
    saveEnrollment() {
        if (this.currentEnrollmentFeatures) {
            this.enrollmentData = {
                features: this.currentEnrollmentFeatures,
                timestamp: Date.now()
            };

            // Save to localStorage
            localStorage.setItem('voiceEnrollment', JSON.stringify(this.enrollmentData));

            // Update UI
            this.checkEnrollmentStatus();
            this.updateStatus('enrollment', 'Voiceprint saved successfully!', 'ready');
            
            // Hide save button
            document.getElementById('save-enrollment').style.display = 'none';
            
            // Show success message
            setTimeout(() => {
                alert('Voice enrollment completed successfully! You can now authenticate using your voice.');
            }, 500);
        }
    }

    // Authenticate voice against stored enrollment
    authenticateVoice(authFeatures) {
        if (!this.enrollmentData || !this.enrollmentData.features) {
            this.showAuthResult(false, 0, 'No enrollment data found. Please enroll first.');
            return;
        }

        try {
            // Calculate similarity between enrolled and authentication features
            const similarity = this.calculateCosineSimilarity(
                this.enrollmentData.features,
                authFeatures
            );

            const similarityPercentage = Math.round(similarity * 100);
            const threshold = 85; // 85% similarity threshold
            const isAuthenticated = similarity >= (threshold / 100);

            // Show similarity score
            this.showSimilarityScore(similarityPercentage);

            // Show authentication result
            this.showAuthResult(isAuthenticated, similarityPercentage);

            // Show feature comparison chart
            this.showFeatureComparison(this.enrollmentData.features, authFeatures);

            // Update status
            const statusText = isAuthenticated ? 
                'Authentication successful!' : 
                'Authentication failed. Similarity too low.';
            this.updateStatus('authentication', statusText, isAuthenticated ? 'ready' : '');

        } catch (error) {
            console.error('Error during authentication:', error);
            this.showAuthResult(false, 0, 'Error during authentication. Please try again.');
        }
    }

    // Calculate cosine similarity between two feature vectors
    calculateCosineSimilarity(features1, features2) {
        // Flatten and combine all features into single vectors
        const vector1 = this.flattenFeatures(features1);
        const vector2 = this.flattenFeatures(features2);

        if (vector1.length !== vector2.length) {
            console.warn('Feature vectors have different lengths');
            // Pad shorter vector with zeros
            const maxLength = Math.max(vector1.length, vector2.length);
            while (vector1.length < maxLength) vector1.push(0);
            while (vector2.length < maxLength) vector2.push(0);
        }

        // Calculate cosine similarity
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            norm1 += vector1[i] * vector1[i];
            norm2 += vector2[i] * vector2[i];
        }

        if (norm1 === 0 || norm2 === 0) {
            return 0; // Avoid division by zero
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    // Flatten feature object into a single vector
    flattenFeatures(features) {
        const vector = [];
        
        // Add MFCC coefficients
        if (features.mfcc && Array.isArray(features.mfcc)) {
            vector.push(...features.mfcc);
        }

        // Add single-value features
        const singleFeatures = [
            'spectralCentroid', 'spectralRolloff', 'spectralFlatness', 
            'zcr', 'rms'
        ];

        singleFeatures.forEach(feature => {
            if (typeof features[feature] === 'number') {
                vector.push(features[feature]);
            }
        });

        // Add chroma features
        if (features.chroma && Array.isArray(features.chroma)) {
            vector.push(...features.chroma);
        }

        return vector;
    }

    // Show similarity score with animation
    showSimilarityScore(percentage) {
        const display = document.getElementById('similarity-display');
        const scoreValue = document.getElementById('score-value');
        const similarityFill = document.getElementById('similarity-fill');

        display.style.display = 'block';
        
        // Animate score
        let currentScore = 0;
        const targetScore = percentage;
        const increment = targetScore / 30; // Animation frames

        const scoreAnimation = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreAnimation);
            }
            scoreValue.textContent = Math.round(currentScore) + '%';
        }, 50);

        // Animate progress bar
        setTimeout(() => {
            similarityFill.style.width = percentage + '%';
            
            // Color based on score
            if (percentage >= 85) {
                similarityFill.style.background = 'linear-gradient(135deg, #10B981, #059669)';
            } else if (percentage >= 70) {
                similarityFill.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
            } else {
                similarityFill.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
            }
        }, 500);
    }

    // Show authentication result
    showAuthResult(isSuccess, percentage, customMessage = '') {
        const resultDiv = document.getElementById('auth-result');
        
        if (customMessage) {
            resultDiv.textContent = customMessage;
            resultDiv.className = 'auth-result failure';
        } else if (isSuccess) {
            resultDiv.innerHTML = '✅ Authentication Successful<br>Welcome! Your voice has been verified.';
            resultDiv.className = 'auth-result success';
        } else {
            resultDiv.innerHTML = `❌ Authentication Failed<br>Voice similarity: ${percentage}% (Required: 85%)`;
            resultDiv.className = 'auth-result failure';
        }

        // Animate result appearance
        resultDiv.style.opacity = '0';
        resultDiv.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultDiv.style.transition = 'all 0.5s ease';
            resultDiv.style.opacity = '1';
            resultDiv.style.transform = 'translateY(0)';
        }, 100);
    }

    // Show feature comparison chart
    showFeatureComparison(enrolledFeatures, authFeatures) {
        const chartContainer = document.getElementById('chart-container');
        chartContainer.style.display = 'block';

        // Prepare data for comparison
        const labels = ['MFCC 1-5', 'MFCC 6-10', 'Spectral Centroid', 'Spectral Rolloff', 
                       'Spectral Flatness', 'ZCR', 'RMS', 'Chroma 1-6', 'Chroma 7-12'];
        
        const enrolledData = this.prepareChartData(enrolledFeatures);
        const authData = this.prepareChartData(authFeatures);

        // Destroy existing chart
        if (this.featureChart) {
            this.featureChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('feature-chart').getContext('2d');
        this.featureChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Enrolled Voice',
                    data: enrolledData,
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    borderColor: '#00D4FF',
                    borderWidth: 2,
                    pointBackgroundColor: '#00D4FF'
                }, {
                    label: 'Authentication Voice',
                    data: authData,
                    backgroundColor: 'rgba(176, 38, 255, 0.2)',
                    borderColor: '#B026FF',
                    borderWidth: 2,
                    pointBackgroundColor: '#B026FF'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#FFFFFF'
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#94A3B8',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            color: '#94A3B8',
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    }

    // Prepare feature data for chart display
    prepareChartData(features) {
        const data = [];
        
        // MFCC coefficients (split into two groups for visualization)
        if (features.mfcc && features.mfcc.length >= 10) {
            data.push(this.normalizeValue(features.mfcc.slice(0, 5).reduce((a, b) => a + Math.abs(b), 0)));
            data.push(this.normalizeValue(features.mfcc.slice(5, 10).reduce((a, b) => a + Math.abs(b), 0)));
        } else {
            data.push(0, 0);
        }
        
        // Other features
        data.push(this.normalizeValue(features.spectralCentroid || 0, 5000));
        data.push(this.normalizeValue(features.spectralRolloff || 0, 10000));
        data.push(this.normalizeValue(features.spectralFlatness || 0, 1));
        data.push(this.normalizeValue(features.zcr || 0, 0.5));
        data.push(this.normalizeValue(features.rms || 0, 1));
        
        // Chroma features (split into two groups)
        if (features.chroma && features.chroma.length >= 12) {
            data.push(this.normalizeValue(features.chroma.slice(0, 6).reduce((a, b) => a + Math.abs(b), 0)));
            data.push(this.normalizeValue(features.chroma.slice(6, 12).reduce((a, b) => a + Math.abs(b), 0)));
        } else {
            data.push(0, 0);
        }
        
        return data;
    }

    // Normalize values for chart display (0-100 scale)
    normalizeValue(value, max = 10) {
        return Math.min((Math.abs(value) / max) * 100, 100);
    }

    // Update status message
    updateStatus(mode, message, className) {
        const statusElement = mode === 'enrollment' ? 
            document.getElementById('recording-status') : 
            document.getElementById('auth-status');
        
        statusElement.textContent = message;
        statusElement.className = `recording-status ${className}`;
    }

    // Reset enrollment data
    resetEnrollment() {
        if (confirm('Are you sure you want to reset your voice enrollment? You will need to re-enroll your voice.')) {
            // Clear data
            localStorage.removeItem('voiceEnrollment');
            this.enrollmentData = null;
            this.currentEnrollmentFeatures = null;
            
            // Reset UI
            this.checkEnrollmentStatus();
            document.getElementById('save-enrollment').style.display = 'none';
            document.getElementById('similarity-display').style.display = 'none';
            document.getElementById('chart-container').style.display = 'none';
            document.getElementById('auth-result').textContent = '';
            
            // Clear waveforms
            this.waveformEnrollment.empty();
            this.waveformAuth.empty();
            
            // Reset status messages
            document.getElementById('recording-status').textContent = '';
            document.getElementById('auth-status').textContent = '';
            
            alert('Voice enrollment has been reset. Please enroll your voice again.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Meyda with audio context
    if (typeof Meyda !== 'undefined') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        Meyda.audioContext = audioContext;
        Meyda.bufferSize = 512;
        
        console.log('Meyda initialized successfully');
    }
    
    // Create voice authentication system
    new VoiceAuthSystem();
    
    console.log('Voice Authentication System initialized');
});

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}