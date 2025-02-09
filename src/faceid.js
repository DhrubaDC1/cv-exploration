class FaceTracker {
    constructor() {
        this.trackedFaces = new Map(); // Map to store face data
        this.nextId = 1; // Counter for generating unique IDs
        this.matchThreshold = 0.6; // Distance threshold for face matching
    }

    // Calculate Euclidean distance between face descriptors
    calculateDistance(desc1, desc2) {
        return desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0);
    }

    // Update or assign new ID to a face
    updateFace(faceDescriptor, faceData) {
        let minDistance = Infinity;
        let matchedId = null;

        // Compare with existing faces
        for (const [id, data] of this.trackedFaces.entries()) {
            const distance = this.calculateDistance(faceDescriptor, data.descriptor);
            if (distance < minDistance && distance < this.matchThreshold) {
                minDistance = distance;
                matchedId = id;
            }
        }

        if (matchedId !== null) {
            // Update existing face data
            this.trackedFaces.set(matchedId, {
                descriptor: faceDescriptor,
                lastSeen: Date.now(),
                ...faceData
            });
            return matchedId;
        } else {
            // Assign new ID to face
            const newId = this.nextId++;
            this.trackedFaces.set(newId, {
                descriptor: faceDescriptor,
                lastSeen: Date.now(),
                ...faceData
            });
            return newId;
        }
    }

    // Clean up old face tracks (optional, can be called periodically)
    cleanup(maxAge = 5000) {
        const now = Date.now();
        for (const [id, data] of this.trackedFaces.entries()) {
            if (now - data.lastSeen > maxAge) {
                this.trackedFaces.delete(id);
            }
        }
    }
}

export default FaceTracker;
