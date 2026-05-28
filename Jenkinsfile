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
                    
                    // Native Windows batch step targeting the correct REST API endpoint without printing verbose text headers
                    def output = bat(script: 'curl -s -u "%GITHUB_CREDS%" "https://github.com"', returnStdout: true).trim()
                    
                    try {
                        // Parse the raw payload text directly into a safe Groovy data object via native Jenkins utilities
                        def jsonResponse = readJSON text: output
                        
                        // Navigate the object properties directly, completely safe from masking validation blocks
                        def limit     = jsonResponse.resources.core.limit
                        def remaining = jsonResponse.resources.core.remaining
                        def resetTime = jsonResponse.resources.core.reset
                        
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
             // remove: git 'https://github.com/mcorries/jenkins-kubernetes-deployment.git'
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
