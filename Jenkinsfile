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
                    
                    // Native Windows batch step targeting the correct REST API to fetch rate limit headers
                    def output = bat(script: 'curl -s -i -u "%GITHUB_CREDS%" "https://github.com"', returnStdout: true).trim()
                    
                    // Cross-platform wildcards (.*?\\d+) bypass invisible Windows carriage return (\\r\\n) formatting conflicts
                    def limitMatcher     = (output =~ /x-ratelimit-limit:.*?(\d+)/)
                    def remainingMatcher = (output =~ /x-ratelimit-remaining:.*?(\d+)/)
                    def resetMatcher     = (output =~ /x-ratelimit-reset:.*?(\d+)/)
                    
                    if (limitMatcher.find() && remainingMatcher.find() && resetMatcher.find()) {
                        def limit     = limitMatcher[0][1]
                        def remaining = remainingMatcher[0][1]
                        def resetTime = resetMatcher[0][1]
                        
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
                        error "Pipeline halted: Failed to parse GitHub API metrics from curl output."
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
