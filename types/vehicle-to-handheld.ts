export interface Vehicle2Handheld {
    VehicleMacAddress: string,
    HandheldMacAddress: string,
    VehiclePosition: {
        latitude: number,
        longitude: number,
        lastUpdate: string
    },
    HandheldPosition: {
        latitude: number,
        longitude: number,
        lastUpdate: string
    }
}