pipeline {
    agent any
    environment {
        // Safe global credential binding. Secrets are strictly masked and stay out of clear text logs.
        GITHUB_CREDS = credentials('my-github-creds')
        dockerimagename = "bravinwasike/react-app"
        dockerImage = ""                                                                                            
    }          
    stages {
        stage('Verify GitHub Auth & Rate Limit') {
            steps {
                script {
                    echo "Checking GitHub authentication for user: ${env.GITHUB_CREDS_USR}"
                    
                    // Fixed: Targets the live REST API endpoint while securely mapping credentials out of plain sight
                    def output = bat(script: 'curl -s -u "%GITHUB_CREDS%" "https://github.com"', returnStdout: true).trim()
                    
                    if (!output.contains("{")) {
                        error "Pipeline halted: Server did not return a valid data object.\nRaw Text:\n${output}"
                    }
                    
                    def jsonText = output.substring(output.indexOf("{"))
                    
                    try {
                        // Native Java/Groovy parsing engine processes data natively into memory
                        def jsonParser = new groovy.json.JsonSlurper()
                        def jsonResponse = jsonParser.parseText(jsonText)
                        
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
                        error "Pipeline halted: Failed to parse GitHub API JSON payload. Error detail: ${e.getMessage()}"
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
