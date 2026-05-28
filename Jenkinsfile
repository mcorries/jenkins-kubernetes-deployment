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
                    
                    // Native Windows batch execution bypasses PowerShell background header-stripping bugs completely
                    // Using modern token authorization header format directly over the verified API gateway
                    def output = bat(script: 'curl -s -H "Authorization: token %GITHUB_CREDS_PSW%" -H "User-Agent: Jenkins-Pipeline" "https://github.com"', returnStdout: true).trim()
                    
                    // Defensively ensure we received a valid JSON text envelope block
                    if (!output.contains("{") || !output.contains("}")) {
                        error "Pipeline halted: Server did not return a valid data payload.\nRaw Output:\n${output}"
                    }
                    
                    // Strip any trailing command line text to isolate the raw JSON block cleanly
                    def cleanJsonText = output.substring(output.indexOf("{"), output.lastIndexOf("}") + 1)
                    
                    try {
                        // Safe, plugin-free native Groovy parsing maps numbers directly into memory variables
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
                        error "Pipeline halted: Failed to parse GitHub API metrics payload. Error detail: ${e.getMessage()}\nTarget text:\n${cleanJsonText}"
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
          docker.withRegistry( 'https://docker.com', registryCredential ) {
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
