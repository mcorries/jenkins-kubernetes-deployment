node {
    // This securely binds your original credential token string straight out of plain log sight
    withCredentials([usernamePassword(credentialsId: 'my-github-creds', usernameVariable: 'GITHUB_CREDS_USR', passwordVariable: 'GITHUB_CREDS_PSW')]) {
        
        // The next single line automatically binds both username and password variables globally
        // 'my-github-creds' is the ID of your credential stored in Jenkins
        def dockerimagename = "bravinwasike/react-app"
        def dockerImage = ""

        stage('Verify GitHub Auth & Rate Limit') {
            echo "Checking GitHub authentication for user: mcorries"
            
            // Single quotes (''') stop Jenkins from altering the code or causing syntax bugs
            def psScript = '''
                $token = $env:GITHUB_CREDS_PSW
                
                if ([string]::IsNullOrEmpty($token)) {
                    Write-Error "PowerShell environment check failed: GITHUB_CREDS_PSW is empty!"
                    exit 1
                }
                
                # Using the modern HTTP Bearer standard recommended by GitHub for active Personal Access Tokens
                $headers = @{ 
                    "Authorization" = "Bearer $token" 
                    "User-Agent"    = "Jenkins-Pipeline"
                    "Accept"        = "application/vnd.github.v3+json"
                }
                
                try {
                    # Using the official public REST API endpoint to pull the raw JSON metrics layout cleanly
                    $response = Invoke-RestMethod -Uri "https://github.com" -Headers $headers -Method Get
                    
                    $limit     = $response.resources.core.limit
                    $remaining = $response.resources.core.remaining
                    $reset     = $response.resources.core.reset
                    
                    Write-Output "LIMIT:$limit"
                    Write-Output "REMAINING:$remaining"
                    Write-Output "RESET:$reset"
                } catch {
                    Write-Error "GitHub API call failed. Check your PAT credentials."
                    exit 1
                }
            '''
            
            // Execute the script safely
            def output = powershell(script: psScript, returnStdout: true).trim()
            
            // Match fields defensively to prevent index out of bounds exceptions
            def limitMatcher = (output =~ /LIMIT:(\d+)/)
            def remainingMatcher = (output =~ /REMAINING:(\d+)/)
            def resetMatcher = (output =~ /RESET:(\d+)/)
            
            if (limitMatcher.find() && remainingMatcher.find() && resetMatcher.find()) {
                // Extract text cleanly out of the match groups using explicit tracking array indexes
                def limit     = limitMatcher[0][1]
                def remaining = remainingMatcher[0][1]
                def resetTime = resetMatcher[0][1]
                
                echo "----------------------------------------"
                echo "SUCCESS: Authenticated to GitHub REST API"
                echo "GitHub API Rate Limit: ${limit}"
                echo "Remaining Requests: ${remaining}"
                echo "Reset Time (Epoch): ${resetTime}"
                echo "----------------------------------------"
                
                if (remaining.toInteger() < 10) {
                    error "Pipeline halted: GitHub API rate limit is critically low (${remaining} remaining)."
                }
            } else {
                error "Pipeline halted: Failed to parse GitHub API metrics from PowerShell output.\nRaw Output:\n${output}"
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
            docker.withRegistry('https://docker.com', registryCredential) {
                dockerImage.push("latest")
            }
        }

        stage('Deploying React.js container to Kubernetes') {
            kubernetesDeploy(configs: "deployment.yaml, service.yaml")
        }
    }
}
