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
                    
                    def psScript = '''
                        # These variables are populated automatically by the global environment block above
                        $token = $env:GITHUB_CREDS_PSW
                        $user  = $env:GITHUB_CREDS_USR
                        
                        if ([string]::IsNullOrEmpty($token)) {
                            Write-Error "PowerShell environment check failed: GITHUB_CREDS_PSW is empty!"
                            exit 1
                        }
                        
                        $pair   = "${user}:${token}"
                        $bytes  = [System.Text.Encoding]::ASCII.GetBytes($pair)
                        $base64 = [Convert]::ToBase64String($bytes)
                        
                        $headers = @{ 
                            "Authorization" = "Basic $base64" 
                            "User-Agent"    = "Jenkins-Pipeline"
                            "Accept"        = "application/vnd.github.v3+json"
                        }
                        
                        try {
															   
                            $response = Invoke-RestMethod -Uri "https://api.github.com/rate_limit" -Headers $headers -Method Get
                            
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
                    
                    def output = powershell(script: psScript, returnStdout: true).trim()
                    
                    def limitMatcher = (output =~ /LIMIT:(\d+)/)
                    def remainingMatcher = (output =~ /REMAINING:(\d+)/)
                    def resetMatcher = (output =~ /RESET:(\d+)/)

                    if (limitMatcher.find() && remainingMatcher.find() && resetMatcher.find()) {
                        def limit     = limitMatcher
                        def remaining = remainingMatcher
                        def resetTime = resetMatcher
                        
                        echo "----------------------------------------"
                        echo "SUCCESS: Authenticated as ${env.GITHUB_CREDS_USR}"
                        echo "GitHub API Rate Limit: ${limit}"
                        echo "Remaining Requests: ${remaining}"
                        echo "Reset Window Marker: ${resetTime}"
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
    }

        // Your Windows build, test, and deploy stages follow...

 // Bypass pipleline checkout stage until I can ascertain why it is causing GitHub commit failure
/*    stage('Checkout Source') {
      steps {
     // remove: git 'https://github.com/mcorries/jenkins-kubernetes-deployment.git'
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
          docker.withRegistry( 'https://registry.hub.docker.com', registryCredential ) {
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