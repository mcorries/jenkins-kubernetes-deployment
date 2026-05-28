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
                    
                    // Native Windows batch step targeting the correct rate limit endpoint with JSON content headers
                    def output = bat(script: 'curl -s -H "Accept: application/json" -u "%GITHUB_CREDS%" "https://github.com"', returnStdout: true).trim()
                    
                    if (!output.contains("{")) {
                        error "Pipeline halted: Server did not return a valid JSON payload.\nRaw Output:\n${output}"
                    }
                    
                    def jsonText = output.substring(output.indexOf("{"))
                    
                    try {
                        def jsonParser = new groovy.json.JsonSlurper()
                        def jsonResponse = jsonParser.parseText(jsonText)
                        
                        // Defensively support both raw rate payloads and resource object payload schemas
                        def limit, remaining, resetTime
                        if (jsonResponse.resources != null && jsonResponse.resources.core != null) {
                            limit     = jsonResponse.resources.core.limit
                            remaining = jsonResponse.resources.core.remaining
                            resetTime = jsonResponse.resources.core.reset
                        } else if (jsonResponse.rate != null) {
                            limit     = jsonResponse.rate.limit
                            remaining = jsonResponse.rate.remaining
                            resetTime = jsonResponse.rate.reset
                        } else {
                            error "Pipeline halted: GitHub API JSON structure unrecognized.\nPayload:\n${jsonText}"
                        }
                        
                        echo "----------------------------------------"
                        echo "SUCCESS: Authenticated as ${env.GITHUB_CREDS_USR}"
                        echo "GitHub API Rate Limit: ${limit}"
                        echo "Remaining Requests: ${remaining}"
                        echo "Reset Time (Epoch): ${resetTime}"
                        echo "----------------------------------------"
                        
                        if (remaining.toInteger() < 10) {
                            error "Pipeline halted: GitHub API rate limit is critically low."
                        }
                    } catch (Exception e) {
                        error "Pipeline halted: Failed to parse GitHub API JSON payload. Error detail: ${e.getMessage()}\nRaw JSON string targeted:\n${jsonText}"
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
            steps {
                script {
                    dockerImage = docker.build("${dockerimagename}")
                }
            }
        }
        
        stage('Pushing Image') {
            environment {
                registryCredential = 'dockerhub-credentials'
            }
            steps {
                script {
                    docker.withRegistry('https://docker.com', registryCredential) {
                        dockerImage.push("latest")
                    }
                }
            }
        }
        
        stage('Deploying React.js container to Kubernetes') {
            steps {
                script {
                    kubernetesDeploy(configs: "deployment.yaml", "service.yaml")
                }  
            }
        }
    }
}
