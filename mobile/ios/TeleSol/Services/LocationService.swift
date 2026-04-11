// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Location Service (GPS)
// ════════════════════════════════════════════════════════════════

import Foundation
import CoreLocation

class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    // MARK: - Published State
    @Published var isAuthorized = false
    @Published var isTracking = false
    @Published var latitude: Double?
    @Published var longitude: Double?
    @Published var accuracy: Double?
    @Published var altitude: Double?

    // MARK: - Private
    private let locationManager = CLLocationManager()

    // MARK: - Init
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 5  // Update every 5 meters
    }

    // MARK: - Start
    func startTracking() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        isTracking = true
    }

    // MARK: - Stop
    func stopTracking() {
        locationManager.stopUpdatingLocation()
        isTracking = false
    }

    // MARK: - CLLocationManagerDelegate
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            isAuthorized = true
        default:
            isAuthorized = false
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        latitude = location.coordinate.latitude
        longitude = location.coordinate.longitude
        accuracy = location.horizontalAccuracy
        altitude = location.altitude
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("[Location] Error: \(error.localizedDescription)")
    }
}
