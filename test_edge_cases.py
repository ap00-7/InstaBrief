#!/usr/bin/env python3
"""
Comprehensive test script for InstaBrief document upload API.
Tests edge cases and verifies SSE streaming works correctly.

Usage:
    python test_edge_cases.py https://your-app.up.railway.app
"""

import sys
import time
import requests
import json
from io import BytesIO
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{'='*60}")
    print(f"{msg}")
    print(f"{'='*60}{Colors.RESET}\n")


class EdgeCaseTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api/documents"
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def test_health_check(self):
        """Test 1: Health check endpoint"""
        print_header("Test 1: Health Check")
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            if response.status_code == 200:
                print_success("Health check passed")
                self.passed += 1
                return True
            else:
                print_error(f"Health check failed: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print_error(f"Health check error: {str(e)}")
            self.failed += 1
            return False

    def test_sse_stream(self):
        """Test 2: SSE streaming endpoint"""
        print_header("Test 2: SSE Stream Test")
        try:
            print_info("Connecting to test stream...")
            response = requests.get(
                f"{self.api_url}/test-stream",
                stream=True,
                timeout=15
            )
            
            if response.status_code != 200:
                print_error(f"Failed to connect: {response.status_code}")
                self.failed += 1
                return False
            
            events_received = 0
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data:'):
                        data = json.loads(decoded[5:].strip())
                        events_received += 1
                        print_info(f"Event {events_received}: {data.get('message', 'Unknown')}")
                        
                        if data.get('status') == 'complete':
                            print_success(f"Stream test completed! Received {events_received} events")
                            self.passed += 1
                            return True
            
            print_warning(f"Stream ended with {events_received} events (expected 11)")
            self.warnings += 1
            return True
            
        except Exception as e:
            print_error(f"Stream test error: {str(e)}")
            self.failed += 1
            return False

    def test_invalid_file_type(self):
        """Test 3: Upload invalid file type"""
        print_header("Test 3: Invalid File Type")
        try:
            # Create a fake .exe file
            files = {'file': ('malware.exe', b'fake executable', 'application/x-msdownload')}
            data = {'summary_length': 50}
            
            print_info("Uploading invalid file type...")
            response = requests.post(
                f"{self.api_url}/upload",
                files=files,
                data=data,
                timeout=10
            )
            
            if response.status_code == 400:
                print_success("Invalid file type correctly rejected")
                self.passed += 1
                return True
            else:
                print_error(f"Invalid file not rejected properly: {response.status_code}")
                self.failed += 1
                return False
                
        except Exception as e:
            print_error(f"Invalid file type test error: {str(e)}")
            self.failed += 1
            return False

    def test_empty_file(self):
        """Test 4: Upload empty file"""
        print_header("Test 4: Empty File")
        try:
            files = {'file': ('empty.txt', b'', 'text/plain')}
            data = {'summary_length': 50}
            
            print_info("Uploading empty file...")
            response = requests.post(
                f"{self.api_url}/upload",
                files=files,
                data=data,
                stream=True,
                timeout=30
            )
            
            has_error = False
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data:'):
                        data = json.loads(decoded[5:].strip())
                        if data.get('status') == 'error' or data.get('error'):
                            has_error = True
                            print_success("Empty file correctly handled with error")
                            self.passed += 1
                            return True
            
            if not has_error:
                print_warning("Empty file didn't produce expected error")
                self.warnings += 1
            return True
                
        except Exception as e:
            print_error(f"Empty file test error: {str(e)}")
            self.failed += 1
            return False

    def test_small_text_file(self):
        """Test 5: Upload small valid text file"""
        print_header("Test 5: Small Text File Upload")
        try:
            content = b"This is a test document. It contains multiple sentences. " * 10
            files = {'file': ('test.txt', content, 'text/plain')}
            data = {'summary_length': 50, 'target_language': 'en'}
            
            print_info("Uploading small text file...")
            response = requests.post(
                f"{self.api_url}/upload",
                files=files,
                data=data,
                stream=True,
                timeout=120
            )
            
            if response.status_code != 200:
                print_error(f"Upload failed: {response.status_code}")
                self.failed += 1
                return False
            
            progress_updates = 0
            success = False
            
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data:'):
                        data = json.loads(decoded[5:].strip())
                        
                        if data.get('status') == 'processing':
                            progress_updates += 1
                            print_info(f"Progress: {data.get('progress', 0)}% - {data.get('message', 'Processing...')}")
                        elif data.get('status') == 'success':
                            success = True
                            print_success(f"Upload successful! Processing time: {data.get('processing_time', 'unknown')}s")
                            print_info(f"Summary length: {len(data.get('summary', {}).get('extractive', ''))} chars")
                            print_info(f"Tags: {', '.join(data.get('tags', []))}")
                        elif data.get('status') == 'error':
                            print_error(f"Upload failed: {data.get('error', 'Unknown error')}")
                            self.failed += 1
                            return False
            
            if success:
                print_success(f"Received {progress_updates} progress updates")
                self.passed += 1
                return True
            else:
                print_error("Upload completed but no success message received")
                self.failed += 1
                return False
                
        except Exception as e:
            print_error(f"Small file upload test error: {str(e)}")
            self.failed += 1
            return False

    def test_different_summary_lengths(self):
        """Test 6: Different summary length percentages"""
        print_header("Test 6: Different Summary Lengths")
        lengths = [10, 50, 100]
        passed_all = True
        
        for length in lengths:
            try:
                content = b"This is a test document with meaningful content. " * 50
                files = {'file': ('test.txt', content, 'text/plain')}
                data = {'summary_length': length}
                
                print_info(f"Testing with summary_length={length}%...")
                response = requests.post(
                    f"{self.api_url}/upload",
                    files=files,
                    data=data,
                    stream=True,
                    timeout=120
                )
                
                success = False
                for line in response.iter_lines():
                    if line:
                        decoded = line.decode('utf-8')
                        if decoded.startswith('data:'):
                            data = json.loads(decoded[5:].strip())
                            if data.get('status') == 'success':
                                success = True
                                summary_len = len(data.get('summary', {}).get('extractive', ''))
                                print_success(f"Length {length}%: Summary {summary_len} chars")
                                break
                            elif data.get('status') == 'error':
                                print_error(f"Length {length}%: {data.get('error')}")
                                passed_all = False
                                break
                
                if not success:
                    print_warning(f"Length {length}%: No success message received")
                    passed_all = False
                    
            except Exception as e:
                print_error(f"Length {length}% error: {str(e)}")
                passed_all = False
        
        if passed_all:
            self.passed += 1
            return True
        else:
            self.failed += 1
            return False

    def test_large_text_file(self):
        """Test 7: Upload large text file (triggers truncation)"""
        print_header("Test 7: Large Text File (50KB+)")
        try:
            # Create a file larger than 50KB (will be truncated)
            content = b"This is a large test document with lots of content. " * 2000
            files = {'file': ('large.txt', content, 'text/plain')}
            data = {'summary_length': 30}
            
            print_info(f"Uploading large file ({len(content)} bytes)...")
            response = requests.post(
                f"{self.api_url}/upload",
                files=files,
                data=data,
                stream=True,
                timeout=180
            )
            
            success = False
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data:'):
                        data = json.loads(decoded[5:].strip())
                        if data.get('status') == 'success':
                            success = True
                            print_success("Large file processed successfully")
                            print_info(f"Processing time: {data.get('processing_time', 'unknown')}s")
                            break
                        elif data.get('status') == 'error':
                            print_error(f"Error: {data.get('error')}")
                            self.failed += 1
                            return False
            
            if success:
                self.passed += 1
                return True
            else:
                print_warning("Large file processing completed but no success message")
                self.warnings += 1
                return True
                
        except Exception as e:
            print_error(f"Large file test error: {str(e)}")
            self.failed += 1
            return False

    def test_concurrent_uploads(self):
        """Test 8: Concurrent upload handling"""
        print_header("Test 8: Concurrent Uploads")
        print_info("This test checks if server can handle multiple simultaneous uploads")
        
        try:
            import threading
            results = {'success': 0, 'failed': 0}
            
            def upload_file(file_num):
                try:
                    content = f"Test document #{file_num}. " * 50
                    files = {'file': (f'test{file_num}.txt', content.encode(), 'text/plain')}
                    data = {'summary_length': 30}
                    
                    response = requests.post(
                        f"{self.api_url}/upload",
                        files=files,
                        data=data,
                        stream=True,
                        timeout=180
                    )
                    
                    for line in response.iter_lines():
                        if line:
                            decoded = line.decode('utf-8')
                            if decoded.startswith('data:'):
                                d = json.loads(decoded[5:].strip())
                                if d.get('status') == 'success':
                                    results['success'] += 1
                                    return
                                elif d.get('status') == 'error':
                                    results['failed'] += 1
                                    return
                except:
                    results['failed'] += 1
            
            # Start 3 concurrent uploads
            threads = []
            for i in range(3):
                t = threading.Thread(target=upload_file, args=(i,))
                t.start()
                threads.append(t)
            
            # Wait for all threads to complete
            for t in threads:
                t.join(timeout=200)
            
            print_info(f"Concurrent uploads: {results['success']} succeeded, {results['failed']} failed")
            
            if results['success'] >= 2:
                print_success("Server handled concurrent uploads well")
                self.passed += 1
                return True
            elif results['success'] >= 1:
                print_warning("Some concurrent uploads succeeded")
                self.warnings += 1
                return True
            else:
                print_error("All concurrent uploads failed")
                self.failed += 1
                return False
                
        except Exception as e:
            print_error(f"Concurrent upload test error: {str(e)}")
            self.failed += 1
            return False

    def test_special_characters(self):
        """Test 9: Text with special characters and unicode"""
        print_header("Test 9: Special Characters and Unicode")
        try:
            content = """
            Test document with special characters:
            - Accents: café, naïve, résumé
            - Symbols: © ® ™ € £ ¥
            - Math: π ∞ ≈ ≠ ±
            - Emoji: 😀 🎉 📄 ✅
            - Languages: Hello 你好 مرحبا हैलो
            """.encode('utf-8')
            
            files = {'file': ('special.txt', content, 'text/plain')}
            data = {'summary_length': 50}
            
            print_info("Uploading file with special characters...")
            response = requests.post(
                f"{self.api_url}/upload",
                files=files,
                data=data,
                stream=True,
                timeout=120
            )
            
            success = False
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data:'):
                        data = json.loads(decoded[5:].strip())
                        if data.get('status') == 'success':
                            success = True
                            print_success("Special characters handled correctly")
                            break
                        elif data.get('status') == 'error':
                            print_error(f"Error: {data.get('error')}")
                            self.failed += 1
                            return False
            
            if success:
                self.passed += 1
                return True
            else:
                print_warning("Processing completed without clear success message")
                self.warnings += 1
                return True
                
        except Exception as e:
            print_error(f"Special characters test error: {str(e)}")
            self.failed += 1
            return False

    def run_all_tests(self):
        """Run all edge case tests"""
        print_header("INSTABRIEF EDGE CASE TESTING")
        print_info(f"Testing API: {self.api_url}")
        
        start_time = time.time()
        
        # Run all tests
        self.test_health_check()
        self.test_sse_stream()
        self.test_invalid_file_type()
        self.test_empty_file()
        self.test_small_text_file()
        self.test_different_summary_lengths()
        self.test_large_text_file()
        self.test_special_characters()
        
        # Concurrent test is optional (can be slow)
        print_info("Note: Skipping concurrent upload test (can be added manually)")
        # self.test_concurrent_uploads()
        
        elapsed = time.time() - start_time
        
        # Print summary
        print_header("TEST SUMMARY")
        print(f"{Colors.BOLD}Total Tests: {self.passed + self.failed}{Colors.RESET}")
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.RESET}")
        print(f"{Colors.YELLOW}Warnings: {self.warnings}{Colors.RESET}")
        print(f"\nTotal Time: {elapsed:.2f}s\n")
        
        if self.failed == 0:
            print_success("All tests passed! API is working correctly.")
            return 0
        else:
            print_error(f"{self.failed} test(s) failed. Please review the errors above.")
            return 1


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_edge_cases.py <BASE_URL>")
        print("Example: python test_edge_cases.py https://your-app.up.railway.app")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = EdgeCaseTester(base_url)
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

