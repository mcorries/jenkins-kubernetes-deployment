node {
    // This securely binds your healthy credential token string straight out of plain log sight
    withCredentials([usernamePassword(credentialsId: 'my-github-creds', usernameVariable: 'GITHUB_CREDS_USR', passwordVariable: 'GITHUB_CREDS_PSW')]) {
        
        // The next single line automatically binds both username and password variables globally
        // 'my-github-creds' is the ID of your credential stored in Jenkins
        def dockerimagename = "bravinwasike/react-app"
        def dockerImage = ""

        stage('Verify GitHub Auth & Rate Limit') {
            echo "Checking GitHub authentication for user: mcorries"
            
            // Fixed: Added silent background automation flags (-s -S -f) to prevent the Windows terminal hanging bug
            def output = bat(script: 'curl -s -S -f -u "%GITHUB_CREDS%" "https://github.com"', returnStdout: true).trim()
            
            // Defensively isolate the clean JSON payload string out of the batch container logs
            if (!output.contains("{") || !output.contains("}")) {
                error "Pipeline halted: Server did not return a valid data payload.\nRaw Output:\n${output}"
            }
            
            def cleanJsonText = output.substring(output.indexOf("{"), output.lastIndexOf("}") + 1)
            
            try {
                // Native Groovy text parsing maps the metrics into variables without regular expression bugs
                def jsonParser = new groovy.json.JsonSlurper()
                def jsonResponse = jsonParser.parseText(cleanJsonText)
                
                def limit     = jsonResponse.resources.core.limit
                def remaining = jsonResponse.resources.core.remaining
                def resetTime = jsonResponse.resources.core.reset
                
                echo "----------------------------------------"
                echo "SUCCESS: Authenticated to GitHub REST API"
                echo "GitHub API Rate Limit: ${limit}"
                echo "Remaining Requests: ${remaining}"
                echo "Reset Time (Epoch): ${resetTime}"
                echo "----------------------------------------"
                
                if (remaining.toInteger() < 10) {
                    error "Pipeline halted: GitHub API rate limit is critically low."
                }
            } catch (Exception e) {
                error "Pipeline halted: Failed to parse GitHub API metrics. Error detail: ${e.getMessage()}\nTarget text:\n${cleanJsonText}"
            }
        }

        // Bypass pipeline checkout stage until I can ascertain why it is causing GitHub commit failure
        /* stage('Checkout Source') {
            timeout(time: 5, unit: 'MINUTES') {
                checkout scm
            }
        } */

        stage('Build image') {
            dockerImage = docker.build("${dockerimagename}")
        }

        stage('Pushing Image') {
            def registryCredential = 'dockerhub-credentials'
            docker.withRegistry('https://developer.com', registryCredential) {
                dockerImage.push("latest")
            }
        }

        stage('Deploying React.js container to Kubernetes') {
            kubernetesDeploy(configs: "deployment.yaml, service.yaml")
        }
    }
}
