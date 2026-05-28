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
                            # 1. WhoAmI check to confirm exact token owner
                            $userCheck = Invoke-RestMethod -Uri "https://github.com" -Headers $headers -Method Get
                            Write-Output "TOKEN_OWNER:$($userCheck.login)"

                            # 2. Rate Limit check
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
                    
                    // Execute PowerShell and capture output string
                    def output = powershell(script: psScript, returnStdout: true).trim()
                    
                    // Regex matchers with [0][1] array mapping to extract the regex groups cleanly
                    def ownerMatcher     = (output =~ /TOKEN_OWNER:(.+)/)
                    def limitMatcher     = (output =~ /LIMIT:(\d+)/)
                    def remainingMatcher = (output =~ /REMAINING:(\d+)/)
                    def resetMatcher     = (output =~ /RESET:(\d+)/)
                    
                    if (ownerMatcher.find() && limitMatcher.find() && remainingMatcher.find() && resetMatcher.find()) {
                        def tokenOwner = ownerMatcher[0][1]
                        def limit      = limitMatcher[0][1]
                        def remaining  = remainingMatcher[0][1]
                        def resetEpoch = resetMatcher[0][1]
                        
                        // 'as Long' casting circumvents the sandbox parseLong error completely!
                        long epochSeconds = resetEpoch as Long
                        java.util.Date resetDate = new java.util.Date(epochSeconds * 1000L)
                        def humanReadableTime = resetDate.format("yyyy-MM-dd HH:mm:ss z", java.util.TimeZone.getTimeZone("UTC"))
                        
                        echo "----------------------------------------"
                        echo "SUCCESS: Authenticated via Jenkins Creds mapping!"
                        echo "GitHub Token Owner Account: ${tokenOwner}" 
                        echo "GitHub API Rate Limit: ${limit}"
                        echo "Remaining Requests: ${remaining}"
                        echo "Reset Window Time: ${humanReadableTime}"
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
 }