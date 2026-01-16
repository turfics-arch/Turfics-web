import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';

class ApiService {
  // Helper to get headers
  static Future<Map<String, String>> getHeaders({bool auth = true}) async {
    Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (auth) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.tokenKey);
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // GET Request
  static Future<dynamic> get(String endpoint, {bool auth = true}) async {
    final headers = await getHeaders(auth: auth);
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: headers,
    );
    return _handleResponse(response);
  }

  // POST Request
  static Future<dynamic> post(String endpoint, dynamic data, {bool auth = true}) async {
    final url = '${AppConstants.baseUrl}$endpoint';
    print('POST REQUEST TO: $url');
    final headers = await getHeaders(auth: auth);
    final response = await http.post(
      Uri.parse(url),
      headers: headers,
      body: jsonEncode(data),
    );
    return _handleResponse(response);
  }

  // PUT Request
  static Future<dynamic> put(String endpoint, dynamic data, {bool auth = true}) async {
    final headers = await getHeaders(auth: auth);
    final response = await http.put(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: headers,
      body: jsonEncode(data),
    );
    return _handleResponse(response);
  }

  // DELETE Request
  static Future<dynamic> delete(String endpoint, {bool auth = true}) async {
    final headers = await getHeaders(auth: auth);
    final response = await http.delete(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: headers,
    );
    return _handleResponse(response);
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      // Basic error handling
      try {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'Something went wrong');
      } catch (e) {
        throw Exception('Server error: ${response.statusCode}');
      }
    }
  }
}
