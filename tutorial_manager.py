"""
Tutorial manager for the Memory Management Visualizer
Provides step-by-step guidance for memory optimization concepts
"""

class TutorialManager:
    """
    Manages tutorial sessions and guides users through memory optimization concepts
    """
    
    def __init__(self):
        """Initialize the tutorial manager with available tutorials"""
        self.current_tutorial = None
        self.current_step = 0
        self.completed_tutorials = set()
        
        # Define available tutorials
        self.tutorials = {
            'intro': {
                'id': 'intro',
                'title': 'Introduction to Memory Management',
                'description': 'Learn the basics of memory allocation and management',
                'steps': [
                    {
                        'title': 'Welcome to Memory Management',
                        'content': 'In this tutorial, you will learn how memory is allocated and managed in computer systems.',
                        'task': 'Click "Next" to continue.',
                        'config': {
                            'memory_size': 512,
                            'page_size': 64,
                            'technique': 'paging',
                            'algorithm': 'FIFO'
                        }
                    },
                    {
                        'title': 'Memory Allocation',
                        'content': 'Memory allocation is the process of assigning memory space for program data and instructions.',
                        'task': 'Allocate 128 bytes of memory by entering "128" in the size field and clicking "Execute Operation".',
                        'expected_operation': {'type': 'allocate', 'size': 128},
                        'config': {}
                    },
                    {
                        'title': 'Memory Access',
                        'content': 'Programs access memory locations to read or modify data. Each access requires translating virtual addresses to physical memory locations.',
                        'task': 'Access memory at address 64 by selecting "Access Memory" operation, entering "64", and clicking "Execute Operation".',
                        'expected_operation': {'type': 'access', 'address': 64},
                        'config': {}
                    },
                    {
                        'title': 'Memory Deallocation',
                        'content': 'When data is no longer needed, memory should be deallocated to be reused by other processes.',
                        'task': 'Deallocate memory by selecting "Deallocate Memory" operation, entering the address shown, and clicking "Execute Operation".',
                        'expected_operation': {'type': 'deallocate'},
                        'config': {}
                    },
                    {
                        'title': 'Introduction Complete',
                        'content': 'Congratulations! You have completed the introduction to memory management.',
                        'task': 'Click "Finish Tutorial" to return to the main interface.',
                        'config': {}
                    }
                ]
            },
            'fragmentation': {
                'id': 'fragmentation',
                'title': 'Memory Fragmentation',
                'description': 'Learn about internal and external memory fragmentation',
                'steps': [
                    {
                        'title': 'Understanding Fragmentation',
                        'content': 'Fragmentation occurs when memory is allocated and deallocated over time, leaving unused gaps.',
                        'task': 'Click "Next" to continue.',
                        'config': {
                            'memory_size': 1024,
                            'page_size': 128,
                            'technique': 'segmentation',
                            'algorithm': 'FIFO'
                        }
                    },
                    {
                        'title': 'External Fragmentation',
                        'content': 'External fragmentation occurs when free memory is split into many small blocks that are not contiguous.',
                        'task': 'Allocate 256 bytes of memory to see how memory blocks are assigned.',
                        'expected_operation': {'type': 'allocate', 'size': 256},
                        'config': {}
                    },
                    {
                        'title': 'Creating Fragmentation',
                        'content': 'Let\'s create some fragmentation by allocating and deallocating memory in a pattern.',
                        'task': 'Allocate another 128 bytes of memory.',
                        'expected_operation': {'type': 'allocate', 'size': 128},
                        'config': {}
                    },
                    {
                        'title': 'Deallocating Memory',
                        'content': 'Now we\'ll deallocate the first block we allocated, creating a "hole" in memory.',
                        'task': 'Deallocate the first memory block by selecting "Deallocate Memory" and using the address shown.',
                        'expected_operation': {'type': 'deallocate'},
                        'config': {}
                    },
                    {
                        'title': 'Observing Fragmentation',
                        'content': 'Notice how the memory now has gaps. This is external fragmentation.',
                        'task': 'Try to allocate 192 bytes and observe how the memory is assigned.',
                        'expected_operation': {'type': 'allocate', 'size': 192},
                        'config': {}
                    },
                    {
                        'title': 'Internal Fragmentation',
                        'content': 'Internal fragmentation occurs when allocated memory is larger than what is needed, wasting space within allocated blocks.',
                        'task': 'Allocate 60 bytes and observe how a full page/segment is allocated despite needing less.',
                        'expected_operation': {'type': 'allocate', 'size': 60},
                        'config': {}
                    },
                    {
                        'title': 'Fragmentation Complete',
                        'content': 'You\'ve learned about both external and internal fragmentation in memory systems.',
                        'task': 'Click "Finish Tutorial" to return to the main interface.',
                        'config': {}
                    }
                ]
            },
            'page_replacement': {
                'id': 'page_replacement',
                'title': 'Page Replacement Algorithms',
                'description': 'Compare different page replacement strategies',
                'steps': [
                    {
                        'title': 'Page Replacement',
                        'content': 'When memory is full, page replacement algorithms decide which pages to remove to make space for new ones.',
                        'task': 'Click "Next" to learn about different algorithms.',
                        'config': {
                            'memory_size': 512,
                            'page_size': 64,
                            'technique': 'paging',
                            'algorithm': 'FIFO'
                        }
                    },
                    {
                        'title': 'First-In-First-Out (FIFO)',
                        'content': 'FIFO replaces the oldest page in memory, regardless of how frequently it\'s used.',
                        'task': 'Fill memory by allocating 512 bytes.',
                        'expected_operation': {'type': 'allocate', 'size': 512},
                        'config': {'algorithm': 'FIFO'}
                    },
                    {
                        'title': 'FIFO Page Fault',
                        'content': 'Now that memory is full, let\'s see how FIFO handles a new allocation.',
                        'task': 'Allocate 128 more bytes and observe which pages are replaced.',
                        'expected_operation': {'type': 'allocate', 'size': 128},
                        'config': {}
                    },
                    {
                        'title': 'Least Recently Used (LRU)',
                        'content': 'LRU replaces the page that hasn\'t been accessed for the longest time.',
                        'task': 'Click "Reset Simulation" and then start a new simulation with LRU algorithm.',
                        'expected_operation': {'type': 'reset'},
                        'config': {'algorithm': 'LRU'}
                    },
                    {
                        'title': 'LRU Memory Access',
                        'content': 'LRU tracks page access history to make replacement decisions.',
                        'task': 'Allocate 256 bytes of memory, then access the first page at address 0.',
                        'expected_operation': {'type': 'allocate', 'size': 256},
                        'config': {}
                    },
                    {
                        'title': 'LRU Page Replacement',
                        'content': 'Now let\'s fill memory and see which pages LRU chooses to replace.',
                        'task': 'Allocate 384 more bytes and observe the replacement pattern.',
                        'expected_operation': {'type': 'allocate', 'size': 384},
                        'config': {}
                    },
                    {
                        'title': 'Algorithm Comparison',
                        'content': 'Different algorithms perform better in different scenarios. The best choice depends on memory access patterns.',
                        'task': 'Click "Finish Tutorial" to return to the main interface.',
                        'config': {}
                    }
                ]
            },
            'optimization': {
                'id': 'optimization',
                'title': 'Memory Optimization Techniques',
                'description': 'Learn practical techniques to optimize memory usage',
                'steps': [
                    {
                        'title': 'Memory Optimization',
                        'content': 'Memory optimization aims to reduce memory usage while maintaining performance.',
                        'task': 'Click "Next" to continue.',
                        'config': {
                            'memory_size': 1024,
                            'page_size': 64,
                            'technique': 'paging',
                            'algorithm': 'LRU'
                        }
                    },
                    {
                        'title': 'Right-Sizing Allocations',
                        'content': 'One optimization technique is to allocate exactly what you need, reducing internal fragmentation.',
                        'task': 'Allocate 60 bytes and notice the internal fragmentation within the page.',
                        'expected_operation': {'type': 'allocate', 'size': 60},
                        'config': {}
                    },
                    {
                        'title': 'Memory Pooling',
                        'content': 'Memory pooling involves pre-allocating fixed-size blocks for frequent allocations.',
                        'task': 'Allocate four 64-byte blocks to simulate a memory pool.',
                        'expected_operation': {'type': 'allocate', 'size': 64},
                        'config': {}
                    },
                    {
                        'title': 'Locality of Reference',
                        'content': 'Programs with good locality of reference (accessing nearby memory addresses) perform better.',
                        'task': 'Access memory addresses 0, 4, 8, and 12 in sequence to demonstrate spatial locality.',
                        'expected_operation': {'type': 'access', 'address': 0},
                        'config': {}
                    },
                    {
                        'title': 'Compaction',
                        'content': 'Memory compaction rearranges allocated blocks to eliminate external fragmentation.',
                        'task': 'Allocate and deallocate memory to create fragmentation, then observe the compaction process.',
                        'expected_operation': {'type': 'deallocate'},
                        'config': {}
                    },
                    {
                        'title': 'Optimization Challenge',
                        'content': 'Now, try to allocate memory efficiently to achieve at least a 75% utilization rate.',
                        'task': 'Allocate memory in an optimal pattern to reach the target utilization.',
                        'expected_operation': {'type': 'allocate'},
                        'config': {}
                    },
                    {
                        'title': 'Optimization Complete',
                        'content': 'Congratulations! You\'ve learned several memory optimization techniques.',
                        'task': 'Click "Finish Tutorial" to return to the main interface.',
                        'config': {}
                    }
                ]
            }
        }
    
    def start_tutorial(self, tutorial_id):
        """
        Start a specific tutorial
        
        Args:
            tutorial_id (str): ID of the tutorial to start
            
        Returns:
            dict: First step of the tutorial or error message
        """
        if tutorial_id not in self.tutorials:
            return {
                'error': True,
                'message': f'Tutorial with ID {tutorial_id} not found'
            }
        
        self.current_tutorial = tutorial_id
        self.current_step = 0
        
        return self.get_current_step()
    
    def next_step(self):
        """
        Advance to the next step in the current tutorial
        
        Returns:
            dict: Next step information or completion message
        """
        if not self.current_tutorial:
            return {
                'error': True,
                'message': 'No tutorial is currently active'
            }
        
        tutorial = self.tutorials[self.current_tutorial]
        
        if self.current_step >= len(tutorial['steps']) - 1:
            # Tutorial completed
            self.completed_tutorials.add(self.current_tutorial)
            return {
                'completed': True,
                'message': f'Tutorial "{tutorial["title"]}" completed!',
                'tutorial': self.current_tutorial
            }
        
        self.current_step += 1
        return self.get_current_step()
    
    def previous_step(self):
        """
        Go back to the previous step in the current tutorial
        
        Returns:
            dict: Previous step information
        """
        if not self.current_tutorial:
            return {
                'error': True,
                'message': 'No tutorial is currently active'
            }
        
        if self.current_step <= 0:
            return {
                'error': True,
                'message': 'Already at the first step'
            }
        
        self.current_step -= 1
        return self.get_current_step()
    
    def get_current_step(self):
        """
        Get the current tutorial step
        
        Returns:
            dict: Current step information
        """
        if not self.current_tutorial:
            return {
                'error': True,
                'message': 'No tutorial is currently active'
            }
        
        tutorial = self.tutorials[self.current_tutorial]
        step = tutorial['steps'][self.current_step]
        
        return {
            'error': False,
            'tutorial_id': self.current_tutorial,
            'tutorial_title': tutorial['title'],
            'step_index': self.current_step,
            'total_steps': len(tutorial['steps']),
            'step': step,
            'is_last_step': self.current_step == len(tutorial['steps']) - 1,
            'is_first_step': self.current_step == 0
        }
    
    def verify_step_completed(self, operation_data):
        """
        Verify if a user operation completes the current tutorial step
        
        Args:
            operation_data (dict): Data about the operation performed
            
        Returns:
            bool: True if the operation completes the step
        """
        if not self.current_tutorial:
            return False
        
        step = self.tutorials[self.current_tutorial]['steps'][self.current_step]
        
        # If no expected operation, any operation is fine
        if 'expected_operation' not in step:
            return True
        
        expected = step['expected_operation']
        
        # If expected type is reset, we need to check differently
        if expected.get('type') == 'reset':
            return operation_data.get('type') == 'reset'
        
        # Check if operation matches expected
        if expected.get('type') != operation_data.get('type'):
            return False
            
        # For allocate operations, check size
        if expected.get('type') == 'allocate' and 'size' in expected:
            return int(operation_data.get('size', 0)) == int(expected['size'])
            
        # For access operations, check address
        if expected.get('type') == 'access' and 'address' in expected:
            return int(operation_data.get('address', -1)) == int(expected['address'])
            
        # For deallocate operations, we're more flexible (any deallocate works)
        if expected.get('type') == 'deallocate':
            return True
            
        return False
    
    def get_tutorial_list(self):
        """
        Get list of available tutorials with completion status
        
        Returns:
            list: List of tutorial information
        """
        result = []
        
        for tutorial_id, tutorial in self.tutorials.items():
            result.append({
                'id': tutorial_id,
                'title': tutorial['title'],
                'description': tutorial['description'],
                'completed': tutorial_id in self.completed_tutorials
            })
            
        return result
    
    def end_tutorial(self):
        """
        End the current tutorial
        
        Returns:
            dict: Status message
        """
        if not self.current_tutorial:
            return {
                'error': True,
                'message': 'No tutorial is currently active'
            }
        
        tutorial_id = self.current_tutorial
        self.current_tutorial = None
        self.current_step = 0
        
        return {
            'error': False,
            'message': f'Tutorial ended',
            'tutorial_id': tutorial_id
        }