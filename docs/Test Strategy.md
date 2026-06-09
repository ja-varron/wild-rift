### **Test Plan: Tuon - Mock Board Exam & Analytics System**

#### **1. Introduction**

This document outlines the comprehensive testing strategy for the **Tuon: Mock Board Exam & Analytics System**. The purpose of this Test Plan is to detail the scope, approach, resources, and schedule of all testing activities. The goal is to ensure the system meets its specified requirements, is free of critical defects, and provides a reliable, high-quality experience for all users, including administrators, instructors, and students of the Visayas State University (VSU) Review Center.

This plan covers the testing of two primary components:
*   **`exam-paper-omr`**: The Python-based backend responsible for Optical Mark Recognition (OMR), automated grading, and API services.
*   **`wild-rift`**: The React-based frontend web application that provides the user interface for all system interactions.

#### **2. Test Objectives**

*   **Functionality:** Verify that all features described in the Software Requirements Specification (SRS) work as intended.
*   **Accuracy:** Ensure the OMR processing and automated grading are highly accurate and reliable.
*   **Reliability:** Confirm the system can operate continuously without failures and can handle expected loads.
*   **Usability:** Validate that the user interface is intuitive, user-friendly, and accessible for all user roles.
*   **Performance:** Ensure the system responds within an acceptable time frame, especially during image processing and data retrieval.
*   **Security:** Verify that user data is secure and that access is properly restricted based on user roles.

#### **3. Scope**

##### **3.1 In Scope**

*   **Functional Testing:**
    *   User Authentication (Login, Logout, Role-Based Access Control).
    *   Admin Module: User account creation and management.
    *   Instructor Module: Exam profile creation, answer key management, answer sheet scanning/upload, result verification, and feedback management.
    *   Student Module: Viewing exam results, performance analytics, and instructor feedback.
    *   Automated email notifications for result releases.
*   **Backend API Testing:**
    *   Validation of all API endpoints for the `exam-paper-omr` service.
    *   Testing of OMR accuracy with various scanned image qualities.
*   **UI/UX Testing:**
    *   Verification of the user interface against the design mockups.
    *   Cross-browser compatibility testing (Chrome, Firefox, Safari).
    *   Responsiveness testing on desktop, tablet, and mobile viewports.
*   **Basic Performance Testing:**
    *   Response time for image uploads and OMR processing.
    *   Load time for analytics dashboards.

##### **3.2 Out of Scope**

*   Advanced load, stress, and volume testing beyond the expected user load of the VSU Review Center.
*   Formal security penetration testing (though basic security best practices will be validated).
*   Hardware testing of physical scanning devices.
*   Testing of third-party services such as email providers and network infrastructure.
*   Integration with external Learning Management Systems (LMS), as this is a future requirement.

#### **4. Test Strategy**

The test strategy employs a multi-layered approach to ensure comprehensive coverage:

1.  **Unit Testing:** Developers will write unit tests for individual functions and components. `Pytest` will be used for the Python backend, and `Jest` with `React Testing Library` will be used for the React frontend.
2.  **Integration Testing:** This will focus on testing the interaction between components, such as the frontend making API calls to the backend and the backend interacting with the database.
3.  **End-to-End (E2E) Testing:** Automated test scripts using `Cypress` will simulate full user workflows from start to finish, such as an instructor uploading an exam and a student viewing the results.
4.  **User Acceptance Testing (UAT):** Stakeholders from the VSU Review Center will conduct manual testing to validate that the system meets their business needs and is acceptable for release.

#### **5. Test Environment**

| Environment | Hardware | Software |
| :--- | :--- | :--- |
| **Development** | Developer Laptop (Multi-core CPU, 8GB+ RAM) | Python 3.9+, Node.js 16+, MySQL 8.0, VS Code, Git |
| **Testing** | Staging Server (e.g., Heroku, AWS EC2) | Production-like environment with Python, Node.js, MySQL |
| **Production** | Production Server (Cloud-based hosting) | Scalable and secure production environment |

#### **6. Roles and Responsibilities**

| Role | Name | Responsibilities |
| :--- | :--- | :--- |
| **Project Manager** | Mr. Varron | Overall project management, resource allocation, final sign-off. |
| **Lead Developer** | Mr. Cerna | Overseeing development, code reviews, managing the central repository. |
| **Test Lead** | Mr. Libardo | Developing the Test Plan, creating test cases, managing defect triage, reporting on test execution. |
| **Developers** | (Team Members) | Writing and executing unit tests, fixing defects. |
| **Stakeholders** | (VSU Review Center) | Participating in UAT, providing feedback, and final acceptance. |

#### **7. Entry and Exit Criteria**

##### **7.1 Entry Criteria (To begin testing)**

*   The Test Plan is approved.
*   The required test environment and tools are set up.
*   The software build is stable and has passed basic smoke tests.
*   All required test data is available.

##### **7.2 Exit Criteria (To conclude testing)**

*   All planned test cases have been executed.
*   There are no open critical or high-priority defects.
*   The test pass rate is above 95%.
*   The Test Summary Report is completed and signed off by the Project Manager.

#### **8. Defect Management**

Defects will be tracked using a GitHub Issue repository. Each bug report will include:
*   A clear, descriptive title.
*   Steps to reproduce the bug.
*   Expected results vs. actual results.
*   Screenshots or video recordings, if applicable.
*   Priority (Critical, High, Medium, Low) and Severity.

The Test Lead will triage new bugs and assign them to the appropriate developer for resolution. Regular bug triage meetings will be held to review and prioritize open defects.
