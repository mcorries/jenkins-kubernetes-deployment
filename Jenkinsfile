pipeline {
  environment {
    // 'github-user-creds' is the ID of your credential stored in Jenkins
    GITHUB_CREDS = credentials('my-github-creds')
    dockerimagename = "bravinwasike/react-app"
    dockerImage = ""
  }
  agent any
  stages {
     stage('Verify GitHub Auth & Rate Limit') {
    steps {
        script {
            echo "Checking GitHub authentication for user: ${GITHUB_CREDS_USR}"
            
            // Run Windows PowerShell to query the GitHub API
            def psScript = '''
                # Read credentials safely from the environment block
                $token = $env:GITHUB_CREDS_PSW
                $user  = $env:GITHUB_CREDS_USR
                
                # Create basic auth header safely in PowerShell
                $pair   = "${user}:${token}"
                $bytes  = [System.Text.Encoding]::ASCII.GetBytes($pair)
                $base64 = [Convert]::ToBase64String($bytes)
                $headers = @{ Authorization = "Basic $base64" }
                
                try {
                    # Fetch and parse the API response
                    $response = Invoke-RestMethod -Uri "https://github.com" -Headers $headers -Method Get
                    
                    # Extract data
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
            
            // Execute the script and catch the console output lines
            def output = powershell(script: psScript, returnStdout: true).trim()
            
            // Match fields defensively to prevent index out of bounds exceptions
            def limitMatcher = (output =~ /LIMIT:(\d+)/)
            def remainingMatcher = (output =~ /REMAINING:(\d+)/)
            def resetMatcher = (output =~ /RESET:(\d+)/)
            
            if (limitMatcher.find() && remainingMatcher.find() && resetMatcher.find()) {
                def limit     = limitMatcher[0][1]
                def remaining = remainingMatcher[0][1]
                def resetTime = resetMatcher[0][1]
                
                echo "----------------------------------------"
                echo "SUCCESS: Authenticated as ${GITHUB_CREDS_USR}"
                echo "GitHub API Rate Limit: ${limit}"
                echo "Remaining Requests: ${remaining}"
                echo "Reset Time (Epoch): ${resetTime}"
                echo "----------------------------------------"
                
                // Safety check: Fail the pipeline if rate limit is critically low
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