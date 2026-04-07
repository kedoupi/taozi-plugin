# Swift 安全规范

> 本文件扩展 [common/security.md](../security.md)

## Keychain 安全存储

```swift
// ✅ 敏感数据（token、密钥）存入 Keychain
enum KeychainHelper {
    static func save(key: String, data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
        let attrs: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        let status = SecItemAdd(attrs as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.saveFailed(status) }
    }
}
```

## App Transport Security

```xml
<!-- Info.plist: 默认强制 HTTPS -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

## 安全 Codable 解码

```swift
struct SafeUser: Decodable {
    let id: String
    let email: String

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        email = try c.decode(String.self, forKey: .email)
        guard id.isEmpty == false else {
            throw DecodingError.dataCorruptedError(forKey: .id, in: c,
                debugDescription: "ID 不能为空")
        }
    }
}
```

## 证书固定

```swift
class PinningDelegate: NSObject, URLSessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard let trust = challenge.protectionSpace.serverTrust,
              let cert = SecTrustGetCertificateAtIndex(trust, 0) else {
            completionHandler(.cancelAuthenticationChallenge, nil); return
        }
        let serverData = SecCertificateCopyData(cert) as Data
        if serverData == loadLocalCertificate() {
            completionHandler(.useCredential, URLCredential(trust: trust))
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}
```

## 安全日志规范

```swift
Logger.info("用户登录: \(user.id)")    // ✅ 只记录 ID
Logger.debug("Token: \(token)")        // ❌ 不要记录敏感数据
```
