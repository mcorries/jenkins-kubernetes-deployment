pipeline {
    agent any
    environment {
    // The next single line automatically binds both username and password variables globally
    // 'my-github-creds' is the ID of your credential stored in Jenkins
    GITHUB_CREDS = credentials('my-github-creds')
    dockerimagename = "bravinwasike/react-app"
    dockerImage = ""                                                                                            
    }          
    stages {
        stage('Verify GitHub Auth & Rate Limit') {
            steps {
                script {
                    echo "Checking GitHub authentication for user: ${env.GITHUB_CREDS_USR}"
                    
                    // Triple single quotes (''') guarantee that Jenkins passes your code cleanly without text scrambling
                    def psScript = '''
                        # Enforce secure TLS 1.2 protocol binding to match your verified terminal environment
                        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

                        $token = $env:GITHUB_CREDS_PSW
                        $user  = $env:GITHUB_CREDS_USR
                        
                        if ([string]::IsNullOrEmpty($token)) {
                            Write-Error "PowerShell environment check failed: GITHUB_CREDS_PSW is empty!"
                            exit 1
                        }
                        
                        # Use explicit mathematical string construction to isolate the colon and prevent legacy parser crashes
                        $pair   = $user + ':' + $token
                        $bytes  = [System.Text.Encoding]::ASCII.GetBytes($pair)
                        $base64 = [Convert]::ToBase64String($bytes)
                        
                        $headers = @{ 
                            Authorization = "Basic $base64" 
                            "User-Agent"  = "Jenkins-Pipeline"
                            "Accept"      = "application/vnd.github.v3+json"
                        }
                        
                        try {
                            # TARGETING THE OFFICIAL LIVE API GATEWAY: This pulls the raw JSON metrics layout cleanly without hitting web bot challenges
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
                    
                    // Execute the script safely using native PowerShell
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
            }
        }

// Bypass pipeline checkout stage until I can ascertain why it is causing GitHub commit failure
/*    stage('Checkout Source') {
      steps {
     // remove: git 'https://github.com'
     // Add following to stop commit stage from hanging and bypass GitHub commit failures 
          timeout(time: 5, unit: 'MINUTES') {
          checkout scm
        }
      }
    }
*/
    stage('Build image') {
      steps{
        script {
          dockerImage = docker.build("${dockerimagename}")
        }
      }
    }
    stage('Pushing Image') {
      environment {
          registryCredential = 'dockerhub-credentials'
           }
      steps{
        script {
          docker.withRegistry( 'https://github.com', registryCredential ) {
            dockerImage.push("latest")
          }
        }
      }
    }
    stage('Deploying React.js container to Kubernetes') {
      steps {
        script {
          kubernetesDeploy(configs: "deployment.yaml", 
                                         "service.yaml")
        }  
      }
    }
  }
}
