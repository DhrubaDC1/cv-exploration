class FaceTracker {
    constructor() {
        this.trackedFaces = new Map(); // Map to store all known faces (permanent storage)
        this.nextId = 1; // Counter for generating unique IDs
        this.matchThreshold = 0.45; // Threshold for face matching
        this.positionWeight = 0.3; // Weight for position-based matching
    }

    // Calculate Euclidean distance between face descriptors
    calculateDescriptorDistance(desc1, desc2) {
        return Math.sqrt(
            desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0)
        );
    }

    // Calculate position-based distance
    calculatePositionDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get face position from detection
    getFacePosition(detection) {
        const box = detection.detection.box;
        return {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            width: box.width,
            height: box.height
        };
    }

    // Calculate similarity score between faces
    calculateSimilarity(newFace, existingFace) {
        // Descriptor distance (normalized)
        const descriptorDistance = this.calculateDescriptorDistance(
            newFace.descriptor,
            existingFace.descriptor
        );

        // Position is only used if the face was seen recently (within 2 seconds)
        const timeSinceLastSeen = Date.now() - existingFace.lastSeen;
        if (timeSinceLastSeen < 2000) {
            // Position distance (normalized by face size)
            const newPos = this.getFacePosition(newFace);
            const existingPos = existingFace.position;
            const averageSize = (newPos.width + newPos.height + existingPos.width + existingPos.height) / 4;
            const positionDistance = this.calculatePositionDistance(newPos, existingPos) / averageSize;

            // Combined score (weighted sum)
            const descriptorScore = 1 - Math.min(descriptorDistance, 1);
            const positionScore = 1 - Math.min(positionDistance, 1);
            
            return (descriptorScore * (1 - this.positionWeight)) + 
                   (positionScore * this.positionWeight);
        }

        // For faces not seen recently, only use descriptor distance
        return 1 - Math.min(descriptorDistance, 1);
    }

    // Update or assign new ID to a face
    updateFace(faceDescriptor, faceData) {
        const now = Date.now();
        let bestMatch = null;
        let bestScore = -1;

        const currentFace = {
            descriptor: faceDescriptor,
            position: this.getFacePosition(faceData),
            ...faceData
        };

        // Find best matching face from all known faces
        for (const [id, data] of this.trackedFaces.entries()) {
            const similarity = this.calculateSimilarity(currentFace, data);
            if (similarity > bestScore && similarity > this.matchThreshold) {
                bestScore = similarity;
                bestMatch = id;
            }
        }

        if (bestMatch !== null) {
            // Update existing face data
            const existingData = this.trackedFaces.get(bestMatch);
            
            // Update descriptor with moving average only if seen recently
            const timeSinceLastSeen = now - existingData.lastSeen;
            const updatedDescriptor = timeSinceLastSeen < 2000 ? 
                this.updateDescriptor(existingData.descriptor, faceDescriptor) :
                existingData.descriptor;

            this.trackedFaces.set(bestMatch, {
                ...existingData,
                descriptor: updatedDescriptor,
                position: currentFace.position,
                lastSeen: now,
                seenCount: (existingData.seenCount || 0) + 1
            });
            return bestMatch;
        } else {
            // Assign new ID to face
            const newId = this.nextId++;
            this.trackedFaces.set(newId, {
                descriptor: faceDescriptor,
                position: currentFace.position,
                lastSeen: now,
                firstSeen: now,
                seenCount: 1
            });
            return newId;
        }
    }

    // Update face descriptor with moving average
    updateDescriptor(oldDesc, newDesc, alpha = 0.2) {
        return oldDesc.map((val, i) => (val * (1 - alpha) + newDesc[i] * alpha));
    }
}

export default FaceTracker;
