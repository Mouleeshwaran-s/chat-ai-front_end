export class SnowflakeIdGenerator {
    private readonly twepoch = 1288834974657n; // Custom epoch
    private readonly workerIdBits = 5n;
    private readonly datacenterIdBits = 5n;
    private readonly sequenceBits = 12n;

    private readonly maxWorkerId = -1n ^ (-1n << this.workerIdBits);
    private readonly maxDatacenterId = -1n ^ (-1n << this.datacenterIdBits);
    private readonly sequenceMask = -1n ^ (-1n << this.sequenceBits);

    private readonly workerIdShift = this.sequenceBits;
    private readonly datacenterIdShift = this.sequenceBits + this.workerIdBits;
    private readonly timestampLeftShift =
        this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

    private lastTimestamp = -1n;
    private sequence = 0n;

    constructor(
        private readonly workerId: bigint,
        private readonly datacenterId: bigint
    ) {
        if (workerId > this.maxWorkerId || workerId < 0n) {
            throw new Error("worker Id out of range");
        }
        if (datacenterId > this.maxDatacenterId || datacenterId < 0n) {
            throw new Error("datacenter Id out of range");
        }
    }

    public nextId(): bigint {
        let timestamp = this.currentTime();

        if (timestamp < this.lastTimestamp) {
            throw new Error("Clock moved backwards.");
        }

        if (this.lastTimestamp === timestamp) {
            this.sequence = (this.sequence + 1n) & this.sequenceMask;
            if (this.sequence === 0n) {
                timestamp = this.tilNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0n;
        }

        this.lastTimestamp = timestamp;

        return (
            ((timestamp - this.twepoch) << this.timestampLeftShift) |
            (this.datacenterId << this.datacenterIdShift) |
            (this.workerId << this.workerIdShift) |
            this.sequence
        );
    }

    private tilNextMillis(lastTimestamp: bigint): bigint {
        let timestamp = this.currentTime();
        while (timestamp <= lastTimestamp) {
            timestamp = this.currentTime();
        }
        return timestamp;
    }

    private currentTime(): bigint {
        return BigInt(Date.now());
    }
}
