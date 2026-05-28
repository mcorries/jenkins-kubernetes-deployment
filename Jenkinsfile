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
                    
                    // Runs the exact terminal command format that you verified yourself 
                    def output = bat(script: 'curl -s -u "%GITHUB_CREDS%" "https://github.com"', returnStdout: true).trim()
                    
                    // If the response doesn't contain valid JSON text format, fail cleanly
                    if (!output.contains("{") || !output.contains("}")) {
                        error "Pipeline halted: Server did not return a valid data object.\nRaw Text:\n${output}"
                    }
                    
                    // Isolate just the text block between the outer brackets to strip carriage returns
                    def cleanJsonText = output.substring(output.indexOf("{"), output.lastIndexOf("}") + 1)
                    
                    // Use basic string slicing to cleanly extract numbers out of the raw text stream
                    def limitText     = cleanJsonText.split('"limit":')
                    def remainingText = cleanJsonText.split('"remaining":')
                    def resetText     = cleanJsonText.split('"reset":')
                    
                    if (limitText.size() > 1 && remainingText.size() > 1 && resetText.size() > 1) {
                        // Strip trailing characters to extract raw numeric strings
                        def limit     = limitText[1].split(',')[0].split('}')[0].trim()
                        def remaining = remainingText[1].split(',')[0].split('}')[0].trim()
                        def resetTime = resetText[1].split(',')[0].split('}')[0].trim()
                        
                        echo "----------------------------------------"
                        echo "SUCCESS: Authenticated as ${env.GITHUB_CREDS_USR}"
                        echo "GitHub API Rate Limit: ${limit}"
                        echo "Remaining Requests: ${remaining}"
                        echo "Reset Time (Epoch): ${resetTime}"
                        echo "----------------------------------------"
                        
                        if (remaining.toInteger() < 10) {
                            error "Pipeline halted: GitHub API rate limit is critically low."
                        }
                    } else {
                        error "Pipeline halted: Failed to extract numeric metrics from curl text stream."
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
